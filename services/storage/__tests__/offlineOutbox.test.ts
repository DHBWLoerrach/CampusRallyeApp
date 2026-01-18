import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys, getStorageItem } from '@/services/storage/asyncStorage';
import {
  enqueueSaveAnswer,
  outbox$,
  processOutbox,
} from '@/services/storage/offlineOutbox';

const mockFrom = jest.fn();
const maybeSingleMock = jest.fn();
const insertMock = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
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
  correct: true,
  points: 3,
  team_answer: 'answer',
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
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({ maybeSingle: maybeSingleMock })),
        })),
      })),
      insert: insertMock,
    });

    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    insertMock.mockResolvedValue({ error: null });
  });

  it('prevents overlapping sync runs', async () => {
    await enqueueSaveAnswer({ ...basePayload });
    const deferred = createDeferred<{ error: null }>();
    insertMock.mockReturnValueOnce(deferred.promise);

    const first = processOutbox();
    const second = processOutbox();

    await flushPromises();
    await flushPromises();
    expect(insertMock).toHaveBeenCalledTimes(1);

    deferred.resolve({ error: null });
    await Promise.all([first, second]);
  });

  it('keeps items enqueued during an active sync', async () => {
    await enqueueSaveAnswer({ ...basePayload, question_id: 10 });
    const deferred = createDeferred<{ error: null }>();
    insertMock.mockReturnValueOnce(deferred.promise);

    const syncPromise = processOutbox();
    await flushPromises();
    await flushPromises();
    expect(insertMock).toHaveBeenCalledTimes(1);

    await enqueueSaveAnswer({ ...basePayload, question_id: 11 });

    deferred.resolve({ error: null });
    await syncPromise;

    const queue = await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE);
    expect(queue).toHaveLength(1);
    expect(queue?.[0]?.payload?.question_id).toBe(11);
  });
});
