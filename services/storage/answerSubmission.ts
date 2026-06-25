import NetInfo from '@react-native-community/netinfo';
import { store$ } from '@/services/storage/Store';
import {
  saveAnswer,
  uploadPhotoAnswer,
} from '@/services/storage/answerStorage';

export type SubmitOutcome =
  | { status: 'local' }
  | { status: 'sent' }
  | { status: 'queued' }
  | { status: 'expired' };

function isRallyeTimeExpired() {
  if (store$.timeExpired.get()) return true;

  const endTime = store$.rallye.get()?.end_time;
  if (!endTime) return false;

  const endMs = new Date(endTime).getTime();
  if (!Number.isFinite(endMs)) return false;

  const expired = endMs <= Date.now();
  if (expired) {
    store$.timeExpired.set(true);
  }
  return expired;
}

export async function submitAnswerAndAdvance(options: {
  teamId: number | null;
  questionId: number;
  answeredCorrectly: boolean;
  pointsAwarded: number;
  answerText?: string;
}): Promise<SubmitOutcome> {
  const { teamId, questionId, answeredCorrectly, pointsAwarded, answerText } =
    options;

  if (!teamId) {
    if (pointsAwarded > 0) {
      store$.points.set((store$.points.get() as number) + pointsAwarded);
    }
    await store$.gotoNextQuestion();
    return { status: 'local' };
  }

  // Team-mode submissions stop at expiry; setting timeExpired in the guard
  // lets RallyeIndex switch away from the active question screen.
  if (isRallyeTimeExpired()) {
    return { status: 'expired' };
  }

  const result = await saveAnswer(
    teamId,
    questionId,
    answeredCorrectly,
    pointsAwarded,
    answerText ?? ''
  );

  if (pointsAwarded > 0) {
    store$.points.set((store$.points.get() as number) + pointsAwarded);
  }
  await store$.gotoNextQuestion();
  return { status: result.status };
}

export type SubmitPhotoOutcome =
  | { status: 'sent' }
  | { status: 'queued' }
  | { status: 'requires_online' }
  | { status: 'expired' };

export async function submitPhotoAnswerAndAdvance(options: {
  teamId: number | null;
  questionId: number;
  pointsAwarded: number;
  imageUri: string;
}): Promise<SubmitPhotoOutcome> {
  const { teamId, questionId, pointsAwarded, imageUri } = options;
  if (!teamId) return { status: 'requires_online' };
  if (isRallyeTimeExpired()) return { status: 'expired' };

  const net = await NetInfo.fetch();
  if (!net.isConnected) return { status: 'requires_online' };

  const { filePath } = await uploadPhotoAnswer({
    imageUri,
    teamId,
    questionId,
  });

  const result = await saveAnswer(
    teamId,
    questionId,
    true,
    pointsAwarded,
    filePath
  );

  if (pointsAwarded > 0) {
    store$.points.set((store$.points.get() as number) + pointsAwarded);
  }
  await store$.gotoNextQuestion();
  return { status: result.status };
}
