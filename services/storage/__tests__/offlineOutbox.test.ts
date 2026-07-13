import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StorageKeys,
  getStorageItem,
  setStorageItem,
} from '@/services/storage/asyncStorage';
import {
  enqueueSaveAnswer,
  outbox$,
  processOutbox,
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

describe('offlineOutbox processOutbox', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
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
    await enqueueSaveAnswer({ ...basePayload });
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
    await enqueueSaveAnswer({ ...basePayload, question_id: 10 });
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
    await enqueueSaveAnswer({ ...basePayload });
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
});
