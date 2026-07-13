import {
  getStorageItem,
  setStorageItem,
  StorageKeys,
} from '@/services/storage/asyncStorage';

/** Cost of using a hint in points. */
export const HINT_COST = 1;

export type HintScope = {
  rallyeId: number;
  teamId: number;
  questionId: number;
};

type UsedHints = Record<string, true>;

function assertValidId(name: keyof HintScope, value: number): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite integer`);
  }
}

function scopeKey(scope: HintScope): string {
  assertValidId('rallyeId', scope.rallyeId);
  assertValidId('teamId', scope.teamId);
  assertValidId('questionId', scope.questionId);
  return JSON.stringify([scope.rallyeId, scope.teamId, scope.questionId]);
}

function normalizeUsedHints(value: unknown): UsedHints {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, true] => {
      return entry[1] === true;
    })
  );
}

async function readUsedHints(): Promise<UsedHints> {
  const stored = await getStorageItem<unknown>(StorageKeys.USED_HINTS);
  return normalizeUsedHints(stored);
}

export async function hasUsedHint(scope: HintScope): Promise<boolean> {
  const key = scopeKey(scope);
  const usedHints = await readUsedHints();
  return usedHints[key] === true;
}

export async function markHintUsed(scope: HintScope): Promise<void> {
  const key = scopeKey(scope);
  const usedHints = await readUsedHints();
  await setStorageItem(StorageKeys.USED_HINTS, {
    ...usedHints,
    [key]: true,
  });
}

export function applyHintCost(
  pointsAwarded: number,
  hintUsed: boolean
): number {
  return hintUsed ? Math.max(0, pointsAwarded - HINT_COST) : pointsAwarded;
}
