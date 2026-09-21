import NetInfo from '@react-native-community/netinfo';
import { store$ } from '@/services/storage/Store';
import {
  saveAnswer,
  uploadPhotoAnswer,
} from '@/services/storage/answerStorage';
import { applyHintCost, hasUsedHint } from '@/services/storage/hintStorage';
import { clearCurrentTeam } from '@/services/storage/teamStorage';
import { getCorrectAnswerTextForQuestion } from '@/utils/answerRows';
import type { TeamId } from '@/types/rallye';

export type SubmitOutcome =
  | { status: 'local' }
  | { status: 'sent' }
  | { status: 'queued' }
  | { status: 'team_missing' };

async function getEffectivePoints(options: {
  teamId: TeamId | null;
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

// The team was deleted server-side (e.g. the rallye was reset). Forget it
// locally so the team can set up a new one instead of answering into the void.
async function forgetDeletedTeam(): Promise<void> {
  const rallyeId = store$.rallye.get()?.id;
  if (rallyeId != null) await clearCurrentTeam(rallyeId);
  store$.reset();
  store$.team.set(null);
  store$.teamDeleted.set(true);
}

export async function submitAnswerAndAdvance(options: {
  teamId: TeamId | null;
  questionId: number;
  pointsAwarded: number;
  isCorrect: boolean;
  answerText?: string;
  showTourFeedback?: boolean;
}): Promise<SubmitOutcome> {
  const {
    teamId,
    questionId,
    pointsAwarded,
    isCorrect,
    answerText,
    showTourFeedback = true,
  } = options;
  const effectivePoints = await getEffectivePoints({
    teamId,
    questionId,
    pointsAwarded,
  });

  if (!teamId) {
    if (effectivePoints > 0) {
      store$.points.set((store$.points.get() as number) + effectivePoints);
    }
    store$.countCorrectTourAnswer(isCorrect);
    await advanceOrShowTourFeedback(questionId, isCorrect, showTourFeedback);
    return { status: 'local' };
  }

  const result = await saveAnswer(
    teamId,
    questionId,
    effectivePoints,
    answerText ?? ''
  );
  if (result.status === 'team_missing') {
    await forgetDeletedTeam();
    return result;
  }

  if (effectivePoints > 0) {
    store$.points.set((store$.points.get() as number) + effectivePoints);
  }
  store$.countCorrectTourAnswer(isCorrect);
  await advanceOrShowTourFeedback(questionId, isCorrect, showTourFeedback);
  return { status: result.status };
}

async function advanceOrShowTourFeedback(
  questionId: number,
  isCorrect: boolean,
  showTourFeedback: boolean
): Promise<void> {
  if (store$.isTourMode.get() && showTourFeedback) {
    const correctAnswer = getCorrectAnswerTextForQuestion(
      store$.answers.get(),
      questionId
    );
    if (isCorrect || correctAnswer) {
      store$.tourFeedback.set({ isCorrect, correctAnswer });
      return;
    }
  }
  await store$.gotoNextQuestion();
}

export type SubmitPhotoOutcome =
  | { status: 'sent' }
  | { status: 'queued' }
  | { status: 'team_missing' }
  | { status: 'requires_online' };

export async function submitPhotoAnswerAndAdvance(options: {
  teamId: TeamId | null;
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
  if (result.status === 'team_missing') {
    await forgetDeletedTeam();
    return result;
  }

  if (effectivePoints > 0) {
    store$.points.set((store$.points.get() as number) + effectivePoints);
  }
  await store$.gotoNextQuestion();
  return { status: result.status };
}
