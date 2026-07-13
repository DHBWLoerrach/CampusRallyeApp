import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { observable } from '@legendapp/state';
import { supabase } from '@/utils/Supabase';
import { StorageKeys, getStorageItem, setStorageItem } from './asyncStorage';

export type SaveAnswerPayload = {
  team_id: number;
  question_id: number;
  team_points: number;
  answer: string;
};

type LegacySaveAnswerPayload = {
  team_id: number;
  question_id: number;
  points: number;
  team_answer: string;
};

export type OfflineActionV1 = {
  id: string;
  type: 'SAVE_ANSWER';
  payloadVersion: 1;
  createdAt: number;
  attempts: number;
  nextRetryAt: number | null;
  payload: SaveAnswerPayload;
  lastError?: string;
};

export const outbox$ = observable({
  online: true,
  syncing: false,
  queueCount: 0,
  lastError: null as string | null,
  lastSyncedAt: 0,
});

function createId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function backoffMs(attempts: number) {
  // 1s, 2s, 4s, ... capped at 60s
  return Math.min(60_000, 1000 * 2 ** Math.max(0, attempts));
}

function normalizeQueueItem(raw: any): OfflineActionV1 | null {
  if (!raw || typeof raw !== 'object') return null;

  // New format already
  if (raw.type === 'SAVE_ANSWER' && raw.payloadVersion === 1 && raw.payload) {
    const p = raw.payload as Partial<
      SaveAnswerPayload & LegacySaveAnswerPayload
    >;
    if (
      typeof p.team_id === 'number' &&
      typeof p.question_id === 'number' &&
      typeof p.team_points === 'number' &&
      typeof p.answer === 'string'
    ) {
      return raw as OfflineActionV1;
    }

    // App versions before the database rename persisted the old field names.
    // Convert them before syncing so queued offline answers are never discarded.
    if (
      typeof p.team_id === 'number' &&
      typeof p.question_id === 'number' &&
      typeof p.points === 'number' &&
      typeof p.team_answer === 'string'
    ) {
      return {
        ...raw,
        payload: {
          team_id: p.team_id,
          question_id: p.question_id,
          team_points: p.points,
          answer: p.team_answer,
        },
      } as OfflineActionV1;
    }
  }

  // Legacy: UPLOAD_PHOTO_ANSWER is intentionally unsupported (online-only)
  if (raw.type === 'UPLOAD_PHOTO_ANSWER') return null;

  return null;
}

async function readQueue(): Promise<OfflineActionV1[]> {
  const raw = (await getStorageItem<any[]>(StorageKeys.OFFLINE_QUEUE)) || [];
  const normalized = raw
    .map(normalizeQueueItem)
    .filter(Boolean) as OfflineActionV1[];

  // If we dropped or transformed items, persist the normalized queue to prevent stuck states.
  const changed =
    normalized.length !== raw.length ||
    normalized.some((item, index) => item !== raw[index]);
  if (changed) {
    await setStorageItem(StorageKeys.OFFLINE_QUEUE, normalized);
  }

  outbox$.queueCount.set(normalized.length);
  return normalized;
}

async function writeQueue(queue: OfflineActionV1[]) {
  await setStorageItem(StorageKeys.OFFLINE_QUEUE, queue);
  outbox$.queueCount.set(queue.length);
}

export async function enqueueSaveAnswer(payload: SaveAnswerPayload) {
  const queue = await readQueue();
  const action: OfflineActionV1 = {
    id: createId(),
    type: 'SAVE_ANSWER',
    payloadVersion: 1,
    createdAt: Date.now(),
    attempts: 0,
    nextRetryAt: null,
    payload,
  };
  queue.push(action);
  await writeQueue(queue);
  return action;
}

let syncPromise: Promise<void> | null = null;

export function processOutbox() {
  if (!outbox$.online.get()) return Promise.resolve();
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    outbox$.syncing.set(true);
    outbox$.lastError.set(null);

    try {
      const queue = await readQueue();
      if (queue.length === 0) return;

      const remaining: OfflineActionV1[] = [];
      const processedIds = new Set<string>();
      for (const action of queue) {
        if (action.nextRetryAt && Date.now() < action.nextRetryAt) {
          remaining.push(action);
          continue;
        }

        try {
          if (action.type !== 'SAVE_ANSWER') {
            processedIds.add(action.id);
            // Unknown action types are discarded to prevent a stuck queue.
            continue;
          }

          const p = action.payload;
          const { error } = await supabase.from('team_answers').upsert(
            {
              team_id: p.team_id,
              question_id: p.question_id,
              team_points: p.team_points,
              answer: p.answer,
            },
            { onConflict: 'team_id,question_id', ignoreDuplicates: true }
          );
          if (error) throw error;
          processedIds.add(action.id);
        } catch (error: any) {
          const attempts = (action.attempts || 0) + 1;
          const nextRetryAt = Date.now() + backoffMs(attempts);
          const lastError = String(error?.message ?? error ?? 'Unknown error');
          remaining.push({
            ...action,
            attempts,
            nextRetryAt,
            lastError,
          });
          outbox$.lastError.set(lastError);
          // Stop processing on first failure to avoid thrashing.
          break;
        }
      }

      const latestQueue = await readQueue();
      const mergedById = new Map(remaining.map((item) => [item.id, item]));
      for (const item of latestQueue) {
        if (processedIds.has(item.id) || mergedById.has(item.id)) continue;
        mergedById.set(item.id, item);
      }
      const merged = Array.from(mergedById.values());

      await writeQueue(merged);
      if (merged.length === 0) {
        outbox$.lastSyncedAt.set(Date.now());
      }
    } finally {
      outbox$.syncing.set(false);
      syncPromise = null;
    }
  })();

  return syncPromise;
}

let started = false;
export function startOutbox() {
  if (started) return;
  started = true;

  void NetInfo.fetch().then((state) => {
    const online = !!state.isConnected;
    outbox$.online.set(online);
    if (online) void processOutbox();
  });

  NetInfo.addEventListener((state) => {
    const online = !!state.isConnected;
    outbox$.online.set(online);
    if (online) void processOutbox();
  });

  AppState.addEventListener('change', (s) => {
    if (s !== 'active') return;
    void NetInfo.fetch().then((state) => {
      const online = !!state.isConnected;
      outbox$.online.set(online);
      if (online) void processOutbox();
    });
  });

  // Initial processing is triggered by NetInfo.fetch() above (only if online).
}
