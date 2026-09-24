/**
 * Concurrent submissions for the same question against the real store, e.g.
 * surrendering while a photo upload is still running.
 */
jest.mock('@/services/storage/offlineOutbox', () => ({
  startOutbox: jest.fn(),
}));
jest.mock('@/services/storage/rallyeStorage', () => ({
  getCurrentRallye: jest.fn(async () => null),
  clearCurrentRallye: jest.fn(async () => {}),
  getRefreshableRallyeFields: jest.fn(async () => null),
}));
jest.mock('@/services/storage/teamStorage', () => ({
  getCurrentTeam: jest.fn(async () => null),
  clearCurrentTeam: jest.fn(async () => {}),
  teamExists: jest.fn(async () => 'exists'),
  setPlayTime: jest.fn(async () => {}),
}));
jest.mock('@/services/storage/hintStorage', () => ({
  applyHintCost: (points: number) => points,
  hasUsedHint: jest.fn(async () => false),
}));
const mockSaveAnswer = jest.fn();
const mockUploadPhotoAnswer = jest.fn();
jest.mock('@/services/storage/answerStorage', () => ({
  saveAnswer: (...args: unknown[]) => mockSaveAnswer(...args),
  uploadPhotoAnswer: (...args: unknown[]) => mockUploadPhotoAnswer(...args),
}));
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(async () => ({ isConnected: true })),
}));
jest.mock('@/utils/Logger', () => ({
  Logger: { info: jest.fn(), error: jest.fn() },
}));

import {
  submitAnswerAndAdvance,
  submitPhotoAnswerAndAdvance,
} from '@/services/storage/answerSubmission';
import { store$ } from '@/services/storage/Store';
import { setPlayTime } from '@/services/storage/teamStorage';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const TEAM_ID = 5;

function startRallye(questionIds: number[]) {
  store$.reset();
  store$.rallye.set({ id: 7, mode: 'department', status: 'running' } as any);
  store$.team.set({ id: TEAM_ID, name: 'Team' } as any);
  store$.questions.set(questionIds.map((id) => ({ id })) as any);
  store$.totalQuestions.set(questionIds.length);
}

describe('concurrent submissions for one question', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveAnswer.mockResolvedValue({ status: 'sent' });
  });

  it('advances and scores only once when a surrender overtakes a photo upload', async () => {
    startRallye([1, 2, 3]);
    const upload = createDeferred<{ filePath: string }>();
    mockUploadPhotoAnswer.mockReturnValue(upload.promise);

    const photo = submitPhotoAnswerAndAdvance({
      teamId: TEAM_ID,
      questionId: 1,
      pointsAwarded: 4,
      imageUri: 'file:///photo.jpg',
    });
    await submitAnswerAndAdvance({
      teamId: TEAM_ID,
      questionId: 1,
      pointsAwarded: 0,
      isCorrect: false,
    });
    upload.resolve({ filePath: '5_1.jpg' });
    await photo;

    expect(store$.currentQuestion.get()?.id).toBe(2);
    expect(store$.answeredCount.get()).toBe(1);
    expect(store$.points.get()).toBe(0);
  });

  it('awards points and finishes only once for a duplicate last answer', async () => {
    startRallye([1]);

    await Promise.all(
      [1, 2].map(() =>
        submitAnswerAndAdvance({
          teamId: TEAM_ID,
          questionId: 1,
          pointsAwarded: 3,
          isCorrect: true,
          answerText: 'QR',
        })
      )
    );

    expect(store$.allQuestionsAnswered.get()).toBe(true);
    expect(store$.points.get()).toBe(3);
    expect(setPlayTime).toHaveBeenCalledTimes(1);
  });
});
