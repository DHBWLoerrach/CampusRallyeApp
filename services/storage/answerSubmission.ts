import NetInfo from '@react-native-community/netinfo';
import { store$ } from '@/services/storage/Store';
import {
  saveAnswer,
  uploadPhotoAnswer,
} from '@/services/storage/answerStorage';
import { applyHintCost, hasUsedHint } from '@/services/storage/hintStorage';

export type SubmitOutcome =
  { status: 'local' } | { status: 'sent' } | { status: 'queued' };

async function getEffectivePoints(options: {
  teamId: number | null;
  questionId: number;
  pointsAwarded: number;
}): Promise<number> {
  const { teamId, questionId, pointsAwarded } = options;
  const usedInMemory = store$.usedHints[questionId].get() === true;

  if (!teamId || usedInMemory) {
    return applyHintCost(pointsAwarded, usedInMemory);
  }

  const rallyeId = store$.rallye.get()?.id;
  if (rallyeId == null) {
    throw new Error('Cannot read hint usage without a rallye ID');
  }

  const usedPersistently = await hasUsedHint({
    rallyeId,
    teamId,
    questionId,
  });
  return applyHintCost(pointsAwarded, usedPersistently);
}

export async function submitAnswerAndAdvance(options: {
  teamId: number | null;
  questionId: number;
  pointsAwarded: number;
  answerText?: string;
}): Promise<SubmitOutcome> {
  const { teamId, questionId, pointsAwarded, answerText } = options;
  const effectivePoints = await getEffectivePoints({
    teamId,
    questionId,
    pointsAwarded,
  });

  if (!teamId) {
    if (effectivePoints > 0) {
      store$.points.set((store$.points.get() as number) + effectivePoints);
    }
    await store$.gotoNextQuestion();
    return { status: 'local' };
  }

  const result = await saveAnswer(
    teamId,
    questionId,
    effectivePoints,
    answerText ?? ''
  );

  if (effectivePoints > 0) {
    store$.points.set((store$.points.get() as number) + effectivePoints);
  }
  await store$.gotoNextQuestion();
  return { status: result.status };
}

export type SubmitPhotoOutcome =
  { status: 'sent' } | { status: 'queued' } | { status: 'requires_online' };

export async function submitPhotoAnswerAndAdvance(options: {
  teamId: number | null;
  questionId: number;
  pointsAwarded: number;
  imageUri: string;
}): Promise<SubmitPhotoOutcome> {
  const { teamId, questionId, pointsAwarded, imageUri } = options;
  if (!teamId) return { status: 'requires_online' };

  const net = await NetInfo.fetch();
  if (!net.isConnected) return { status: 'requires_online' };

  const effectivePoints = await getEffectivePoints({
    teamId,
    questionId,
    pointsAwarded,
  });

  const { filePath } = await uploadPhotoAnswer({
    imageUri,
    teamId,
    questionId,
  });

  const result = await saveAnswer(
    teamId,
    questionId,
    effectivePoints,
    filePath
  );

  if (effectivePoints > 0) {
    store$.points.set((store$.points.get() as number) + effectivePoints);
  }
  await store$.gotoNextQuestion();
  return { status: result.status };
}
