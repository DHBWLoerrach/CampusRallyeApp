import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import {
  StorageKeys,
  getStorageItem,
  setStorageItem,
} from '@/services/storage/asyncStorage';
import {
  enqueueSaveAnswer,
  outbox$,
  processOutbox,
  startOutbox,
} from '@/services/storage/offlineOutbox';

const mockFrom = jest.fn();
const upsertMock = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function flushPromises() {
  return new Promise<void>((resolve) => setImmediate(() => resolve()));
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const basePayload = {
  team_id: 1,
  question_id: 2,
  team_points: 3,
  answer: 'answer',
};

function queuedAnswer({
  id,
  questionId,
  attempts = 0,
  nextRetryAt = null,
}: {
  id: string;
  questionId: number;
  attempts?: number;
  nextRetryAt?: number | null;
}) {
  return {
    id,
    type: 'SAVE_ANSWER' as const,
    payloadVersion: 1 as const,
    createdAt: Date.now(),
    attempts,
    nextRetryAt,
    payload: { ...basePayload, question_id: questionId },
  };
}

describe('offlineOutbox processOutbox', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockFrom.mockReset();
    upsertMock.mockReset();
    await AsyncStorage.clear();
    outbox$.online.set(true);
    outbox$.syncing.set(false);
    outbox$.queueCount.set(0);
    outbox$.lastError.set(null);
    outbox$.lastSyncedAt.set(0);

    mockFrom.mockReturnValue({
      upsert: upsertMock,
    });

    upsertMock.mockResolvedValue({ error: null });
  });

  it('prevents overlapping sync runs', async () => {
    outbox$.online.set(false);
    await enqueueSaveAnswer({ ...basePayload });
    outbox$.online.set(true);
    const deferred = createDeferred<{ error: null }>();
    upsertMock.mockReturnValueOnce(deferred.promise);

    const first = processOutbox();
    const second = processOutbox();

    await flushPromises();
    await flushPromises();
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith(
      {
        team_id: 1,
        question_id: 2,
        team_points: 3,
        answer: 'answer',
      },
      { onConflict: 'team_id,question_id', ignoreDuplicates: true }
    );

    deferred.resolve({ error: null });
    await Promise.all([first, second]);
  });

  it('keeps items enqueued during an active sync', async () => {
    outbox$.online.set(false);
    await enqueueSaveAnswer({ ...basePayload, question_id: 10 });
    outbox$.online.set(true);
    const deferred = createDeferred<{ error: null }>();
    upsertMock.mockReturnValueOnce(deferred.promise);

    const syncPromise = processOutbox();
    await flushPromises();
    await flushPromises();
    expect(upsertMock).toHaveBeenCalledTimes(1);

    await enqueueSaveAnswer({ ...basePayload, question_id: 11 });

    deferred.resolve({ error: null });
    await syncPromise;

    const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
    expect(queue).toHaveLength(1);
    expect(queue?.[0]?.payload?.question_id).toBe(11);
  });

  it('does nothing when offline', async () => {
    outbox$.online.set(false);
    await enqueueSaveAnswer({ ...basePayload });
    await processOutbox();
    expect(upsertMock).not.toHaveBeenCalled();

    // Queue should still have the item
    const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
    expect(queue).toHaveLength(1);
  });

  it('processes an empty queue without errors', async () => {
    await processOutbox();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('increments attempts and sets lastError on failure', async () => {
    outbox$.online.set(false);
    await enqueueSaveAnswer({ ...basePayload });
    outbox$.online.set(true);
    upsertMock.mockResolvedValueOnce({ error: { message: 'db error' } });

    await processOutbox();

    const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
    expect(queue).toHaveLength(1);
    expect(queue![0].attempts).toBe(1);
    expect(queue![0].lastError).toBe('db error');
    expect(queue![0].nextRetryAt).toBeGreaterThan(Date.now() - 5000);
    expect(outbox$.lastError.get()).toBe('db error');
  });

  it('omits the deprecated correctness field from queued answers', async () => {
    await setStorageItem(StorageKeys.OFFLINE_QUEUE, [
      {
        id: 'queued-answer',
        type: 'SAVE_ANSWER',
        payloadVersion: 1,
        createdAt: 1,
        attempts: 0,
        nextRetryAt: null,
        payload: {
          ...basePayload,
          correct: true,
        },
      },
    ]);

    await processOutbox();

    expect(upsertMock).toHaveBeenCalledWith(basePayload, {
      onConflict: 'team_id,question_id',
      ignoreDuplicates: true,
    });
  });

  it('migrates queued V1 answers from the previous field names', async () => {
    await setStorageItem(StorageKeys.OFFLINE_QUEUE, [
      {
        id: 'legacy-v1-answer',
        type: 'SAVE_ANSWER',
        payloadVersion: 1,
        createdAt: 1,
        attempts: 0,
        nextRetryAt: null,
        payload: {
          team_id: 7,
          question_id: 13,
          points: 5,
          team_answer: 'offline answer',
        },
      },
    ]);

    await processOutbox();

    expect(upsertMock).toHaveBeenCalledWith(
      {
        team_id: 7,
        question_id: 13,
        team_points: 5,
        answer: 'offline answer',
      },
      { onConflict: 'team_id,question_id', ignoreDuplicates: true }
    );
    expect(await getStorageItem(StorageKeys.OFFLINE_QUEUE)).toEqual([]);
  });

  it('discards UPLOAD_PHOTO_ANSWER items', async () => {
    const unsupported = [
      {
        type: 'UPLOAD_PHOTO_ANSWER',
        data: { something: true },
      },
    ];
    await setStorageItem(StorageKeys.OFFLINE_QUEUE, unsupported);

    await processOutbox();

    expect(upsertMock).not.toHaveBeenCalled();
    // Queue should be empty after normalization dropped the item
    const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
    expect(queue).toHaveLength(0);
  });

  it('catches rejected NetInfo and AppState background work', async () => {
    const netInfoFetch = NetInfo.fetch as jest.Mock;
    const addNetInfoListener = NetInfo.addEventListener as jest.Mock;
    const addAppStateListener = AppState.addEventListener as jest.Mock;

    netInfoFetch.mockRejectedValueOnce(new Error('initial fetch failed'));
    startOutbox();
    await flushPromises();
    expect(outbox$.lastError.get()).toBe('initial fetch failed');

    const netInfoListener = addNetInfoListener.mock.calls[0][0];
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error('network sync failed')
    );
    netInfoListener({ isConnected: true });
    await flushPromises();
    expect(outbox$.lastError.get()).toBe('network sync failed');

    const appStateListener = addAppStateListener.mock.calls[0][1];
    netInfoFetch.mockRejectedValueOnce(new Error('app refresh failed'));
    appStateListener('active');
    await flushPromises();
    expect(outbox$.lastError.get()).toBe('app refresh failed');

    outbox$.online.set(false);
    await processOutbox();
  });

  describe('retry scheduler', () => {
    const now = new Date('2026-07-13T10:00:00.000Z');

    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ['setImmediate'] });
      jest.setSystemTime(now);
    });

    afterEach(() => {
      outbox$.online.set(false);
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('starts processing after an online enqueue without awaiting the remote sync', async () => {
      const deferred = createDeferred<{ error: null }>();
      upsertMock.mockReturnValueOnce(deferred.promise);

      const action = await enqueueSaveAnswer({ ...basePayload });
      await flushMicrotasks();

      const remoteCallCount = upsertMock.mock.calls.length;
      deferred.resolve({ error: null });
      await flushMicrotasks();

      expect(action.payload).toEqual(basePayload);
      expect(remoteCallCount).toBe(1);
    });

    it('schedules the first retry for exactly one second after a failure', async () => {
      outbox$.online.set(false);
      await enqueueSaveAnswer({ ...basePayload });
      outbox$.online.set(true);
      upsertMock.mockResolvedValueOnce({ error: { message: 'temporary' } });

      await processOutbox();

      const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
      expect(queue?.[0]).toMatchObject({
        attempts: 1,
        nextRetryAt: now.getTime() + 1_000,
        lastError: 'temporary',
      });
      expect(jest.getTimerCount()).toBe(1);
    });

    it('retries when the scheduled delay elapses and removes a successful item', async () => {
      await setStorageItem(StorageKeys.OFFLINE_QUEUE, [
        queuedAnswer({
          id: 'retry-me',
          questionId: 10,
          attempts: 1,
          nextRetryAt: now.getTime() + 1_000,
        }),
      ]);

      await processOutbox();
      expect(upsertMock).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1_000);
      await flushMicrotasks();

      expect(upsertMock).toHaveBeenCalledTimes(1);
      expect(await getStorageItem(StorageKeys.OFFLINE_QUEUE)).toEqual([]);
    });

    it('uses capped exponential delays and keeps retrying beyond five failures', async () => {
      outbox$.online.set(false);
      await enqueueSaveAnswer({ ...basePayload });
      outbox$.online.set(true);
      upsertMock.mockResolvedValue({ error: { message: 'still offline' } });

      await processOutbox();
      const expectedDelays = [1_000, 2_000, 4_000, 8_000, 16_000, 32_000];

      for (const delay of expectedDelays) {
        const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
        expect(queue?.[0]?.nextRetryAt).toBe(Date.now() + delay);
        expect(jest.getTimerCount()).toBe(1);
        await jest.advanceTimersByTimeAsync(delay);
        await flushMicrotasks();
      }

      const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
      expect(queue?.[0]?.attempts).toBe(7);
      expect(queue?.[0]?.nextRetryAt).toBe(Date.now() + 60_000);
      expect(jest.getTimerCount()).toBe(1);
    });

    it('keeps one active sync and one retry timer across concurrent passes', async () => {
      await setStorageItem(StorageKeys.OFFLINE_QUEUE, [
        queuedAnswer({ id: 'one', questionId: 10 }),
      ]);
      const deferred = createDeferred<{ error: { message: string } }>();
      upsertMock.mockReturnValueOnce(deferred.promise);

      const first = processOutbox();
      const second = processOutbox();
      await flushMicrotasks();

      const remoteCallCount = upsertMock.mock.calls.length;
      const timerCountDuringSync = jest.getTimerCount();
      deferred.resolve({ error: { message: 'temporary' } });
      await Promise.all([first, second]);

      expect(remoteCallCount).toBe(1);
      expect(timerCountDuringSync).toBe(0);
      expect(jest.getTimerCount()).toBe(1);
    });

    it('continues syncing later due items after one item fails', async () => {
      await setStorageItem(StorageKeys.OFFLINE_QUEUE, [
        queuedAnswer({ id: 'fails', questionId: 10 }),
        queuedAnswer({ id: 'succeeds', questionId: 11 }),
      ]);
      upsertMock
        .mockResolvedValueOnce({ error: { message: 'temporary' } })
        .mockResolvedValueOnce({ error: null });

      await processOutbox();

      expect(upsertMock).toHaveBeenCalledTimes(2);
      expect(upsertMock.mock.calls[1][0].question_id).toBe(11);
      const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
      expect(queue).toHaveLength(1);
      expect(queue?.[0]?.id).toBe('fails');
    });

    it('does not run a scheduled retry while offline and resumes when online', async () => {
      await setStorageItem(StorageKeys.OFFLINE_QUEUE, [
        queuedAnswer({
          id: 'offline-retry',
          questionId: 10,
          attempts: 1,
          nextRetryAt: now.getTime() + 1_000,
        }),
      ]);

      await processOutbox();
      outbox$.online.set(false);
      await jest.advanceTimersByTimeAsync(1_000);
      await flushMicrotasks();
      expect(upsertMock).not.toHaveBeenCalled();

      outbox$.online.set(true);
      await processOutbox();
      expect(upsertMock).toHaveBeenCalledTimes(1);
    });

    it('reschedules after rejected timer-triggered processing', async () => {
      await setStorageItem(StorageKeys.OFFLINE_QUEUE, [
        queuedAnswer({
          id: 'timer-storage-failure',
          questionId: 10,
          attempts: 1,
          nextRetryAt: now.getTime() + 1_000,
        }),
      ]);
      await processOutbox();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('timer storage failed')
      );

      await jest.advanceTimersByTimeAsync(1_000);
      await flushMicrotasks();

      expect(outbox$.lastError.get()).toBe('timer storage failed');
      expect(jest.getTimerCount()).toBe(1);

      await jest.advanceTimersByTimeAsync(1_000);
      await flushMicrotasks();

      expect(upsertMock).toHaveBeenCalledTimes(1);
      expect(await getStorageItem(StorageKeys.OFFLINE_QUEUE)).toEqual([]);
    });

    it('bounds persisted errors without exposing answer payload data', async () => {
      outbox$.online.set(false);
      await enqueueSaveAnswer({
        ...basePayload,
        answer: 'PRIVATE_ANSWER_VALUE',
      });
      outbox$.online.set(true);
      upsertMock.mockResolvedValueOnce({
        error: {
          message: `team 1 question 2 answer PRIVATE_ANSWER_VALUE failed ${'x'.repeat(700)}`,
        },
      });

      await processOutbox();

      const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
      expect(queue?.[0]?.lastError).toHaveLength(500);
      expect(queue?.[0]?.lastError).not.toContain('PRIVATE_ANSWER_VALUE');
      expect(queue?.[0]?.lastError).not.toContain('team 1');
      expect(queue?.[0]?.lastError).not.toContain('question 2');
      expect(outbox$.lastError.get()).toHaveLength(500);
    });

    it('redacts only structured payload fields when values are short', async () => {
      outbox$.online.set(false);
      await enqueueSaveAnswer({
        ...basePayload,
        answer: '42',
      });
      outbox$.online.set(true);
      upsertMock.mockResolvedValueOnce({
        error: {
          message:
            "Connection timeout after 4200ms (code 12); team_id=1 question_id: 2 answer='42'",
        },
      });

      await processOutbox();

      const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
      expect(queue?.[0]?.lastError).toBe(
        "Connection timeout after 4200ms (code 12); team_id=[redacted] question_id: [redacted] answer='[redacted]'"
      );
    });
  });
});
