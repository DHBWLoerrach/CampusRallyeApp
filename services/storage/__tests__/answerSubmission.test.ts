import {
  submitAnswerAndAdvance,
  submitPhotoAnswerAndAdvance,
} from '@/services/storage/answerSubmission';

// --- Mocks ---
const mockSaveAnswer = jest.fn();
const mockUploadPhotoAnswer = jest.fn();
const mockHasUsedHint = jest.fn();
jest.mock('@/services/storage/answerStorage', () => ({
  saveAnswer: (...args: unknown[]) => mockSaveAnswer(...args),
  uploadPhotoAnswer: (...args: unknown[]) => mockUploadPhotoAnswer(...args),
}));

jest.mock('@/services/storage/hintStorage', () => ({
  applyHintCost: (pointsAwarded: number, hintUsed: boolean) =>
    Math.max(0, pointsAwarded - (hintUsed ? 1 : 0)),
  hasUsedHint: (...args: unknown[]) => mockHasUsedHint(...args),
}));

const mockPointsGet = jest.fn(() => 0);
const mockPointsSet = jest.fn();
const mockGotoNextQuestion = jest.fn(async () => {});
const mockCountCorrectTourAnswer = jest.fn();
const mockIsTourModeGet = jest.fn(() => false);
const mockAnswersGet = jest.fn(
  () =>
    [] as { id: number; question_id: number; text: string; correct: boolean }[]
);
const mockTourFeedbackSet = jest.fn();
const mockUsedHintGet = jest.fn(() => false);
const mockRallyeGet = jest.fn(
  (): {
    id: number;
    rallye_end: string | null;
  } => ({
    id: 10,
    rallye_end: null,
  })
);
jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: {
      get: () => mockRallyeGet(),
    },
    usedHints: new Proxy(
      {},
      {
        get: () => ({ get: () => mockUsedHintGet() }),
      }
    ),
    points: {
      get: () => mockPointsGet(),
      set: (v: number) => mockPointsSet(v),
    },
    countCorrectTourAnswer: (...args: unknown[]) =>
      mockCountCorrectTourAnswer(...args),
    isTourMode: { get: () => mockIsTourModeGet() },
    answers: { get: () => mockAnswersGet() },
    tourFeedback: { set: (value: unknown) => mockTourFeedbackSet(value) },
    gotoNextQuestion: () => mockGotoNextQuestion(),
  },
}));

let mockIsConnected = true;
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(async () => ({ isConnected: mockIsConnected })),
}));

describe('submitAnswerAndAdvance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPointsGet.mockReturnValue(0);
    mockUsedHintGet.mockReturnValue(false);
    mockHasUsedHint.mockResolvedValue(false);
    mockRallyeGet.mockReturnValue({ id: 10, rallye_end: null });
    mockSaveAnswer.mockResolvedValue({ status: 'sent' });
    mockIsTourModeGet.mockReturnValue(false);
    mockAnswersGet.mockReturnValue([]);
  });

  it('returns "local" and advances without saving when no teamId', async () => {
    const result = await submitAnswerAndAdvance({
      teamId: null,
      questionId: 1,
      pointsAwarded: 5,
      isCorrect: true,
    });

    expect(result).toEqual({ status: 'local' });
    expect(mockSaveAnswer).not.toHaveBeenCalled();
    expect(mockPointsSet).toHaveBeenCalledWith(5);
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('shows correct tour feedback before advancing', async () => {
    mockIsTourModeGet.mockReturnValue(true);

    const result = await submitAnswerAndAdvance({
      teamId: null,
      questionId: 1,
      pointsAwarded: 5,
      isCorrect: true,
    });

    expect(result).toEqual({ status: 'local' });
    expect(mockTourFeedbackSet).toHaveBeenCalledWith({
      isCorrect: true,
      correctAnswer: '',
    });
    expect(mockGotoNextQuestion).not.toHaveBeenCalled();
  });

  it('shows the original answer text after an incorrect tour answer', async () => {
    mockIsTourModeGet.mockReturnValue(true);
    mockAnswersGet.mockReturnValue([
      { id: 1, question_id: 1, text: '  Bibliothek  ', correct: true },
    ]);

    await submitAnswerAndAdvance({
      teamId: null,
      questionId: 1,
      pointsAwarded: 0,
      isCorrect: false,
      answerText: 'Mensa',
    });

    expect(mockTourFeedbackSet).toHaveBeenCalledWith({
      isCorrect: false,
      correctAnswer: 'Bibliothek',
    });
    expect(mockGotoNextQuestion).not.toHaveBeenCalled();
  });

  it('advances a surrendered tour question without answer feedback', async () => {
    mockIsTourModeGet.mockReturnValue(true);

    await submitAnswerAndAdvance({
      teamId: null,
      questionId: 1,
      pointsAwarded: 0,
      isCorrect: false,
      showTourFeedback: false,
    });

    expect(mockTourFeedbackSet).not.toHaveBeenCalled();
    expect(mockGotoNextQuestion).toHaveBeenCalledTimes(1);
  });

  it('saves to backend and adds points when team exists', async () => {
    mockPointsGet.mockReturnValue(10);
    const result = await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      pointsAwarded: 3,
      isCorrect: true,
      answerText: 'hello',
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 7, 3, 'hello');
    expect(mockPointsSet).toHaveBeenCalledWith(13);
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('saves the answer when an end time is set', async () => {
    mockRallyeGet.mockReturnValue({
      id: 10,
      rallye_end: '14:30:00',
    });

    const result = await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      pointsAwarded: 2,
      isCorrect: true,
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 7, 2, '');
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('does not add points when pointsAwarded is 0 (incorrect answer)', async () => {
    const result = await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      pointsAwarded: 0,
      isCorrect: false,
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockPointsSet).not.toHaveBeenCalled();
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('returns queued status when saveAnswer queues offline', async () => {
    mockSaveAnswer.mockResolvedValue({ status: 'queued' });

    const result = await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      pointsAwarded: 2,
      isCorrect: true,
    });

    expect(result).toEqual({ status: 'queued' });
  });

  it('subtracts one point from persisted and local points for a used hint', async () => {
    mockPointsGet.mockReturnValue(10);
    mockUsedHintGet.mockReturnValue(true);

    await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      pointsAwarded: 3,
      isCorrect: true,
    });

    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 7, 2, '');
    expect(mockPointsSet).toHaveBeenCalledWith(12);
  });

  it.each([
    [1, 0],
    [0, 0],
  ])(
    'clamps %i awarded point(s) at %i after hint cost',
    async (points, expected) => {
      mockUsedHintGet.mockReturnValue(true);

      await submitAnswerAndAdvance({
        teamId: 42,
        questionId: 7,
        pointsAwarded: points,
        isCorrect: true,
      });

      expect(mockSaveAnswer).toHaveBeenCalledWith(42, 7, expected, '');
      expect(mockPointsSet).not.toHaveBeenCalled();
    }
  );

  it('uses the in-memory hint marker in tour mode', async () => {
    mockPointsGet.mockReturnValue(5);
    mockUsedHintGet.mockReturnValue(true);

    await submitAnswerAndAdvance({
      teamId: null,
      questionId: 7,
      pointsAwarded: 3,
      isCorrect: true,
    });

    expect(mockHasUsedHint).not.toHaveBeenCalled();
    expect(mockPointsSet).toHaveBeenCalledWith(7);
  });

  it('records a correct tour answer even when hint cost reduces points to zero', async () => {
    mockUsedHintGet.mockReturnValue(true);

    await submitAnswerAndAdvance({
      teamId: null,
      questionId: 7,
      pointsAwarded: 1,
      isCorrect: true,
    });

    expect(mockCountCorrectTourAnswer).toHaveBeenCalledWith(true);
  });

  it.each([
    ['without a team', null],
    ['with a team', 42],
  ] as const)(
    'counts the answer before advancing %s',
    async (_case, teamId) => {
      await submitAnswerAndAdvance({
        teamId,
        questionId: 7,
        pointsAwarded: 1,
        isCorrect: true,
      });

      expect(
        mockCountCorrectTourAnswer.mock.invocationCallOrder[0]
      ).toBeLessThan(mockGotoNextQuestion.mock.invocationCallOrder[0]);
    }
  );

  it('applies persisted hint use after the in-memory state was reset', async () => {
    mockHasUsedHint.mockResolvedValue(true);

    await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      pointsAwarded: 3,
      isCorrect: true,
    });

    expect(mockHasUsedHint).toHaveBeenCalledWith({
      rallyeId: 10,
      teamId: 42,
      questionId: 7,
    });
    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 7, 2, '');
  });

  it('rejects without saving or advancing when persisted hint state cannot be read', async () => {
    mockHasUsedHint.mockRejectedValue(new Error('storage unavailable'));

    await expect(
      submitAnswerAndAdvance({
        teamId: 42,
        questionId: 7,
        pointsAwarded: 3,
        isCorrect: true,
      })
    ).rejects.toThrow('storage unavailable');

    expect(mockSaveAnswer).not.toHaveBeenCalled();
    expect(mockPointsSet).not.toHaveBeenCalled();
    expect(mockGotoNextQuestion).not.toHaveBeenCalled();
  });
});

describe('submitPhotoAnswerAndAdvance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = true;
    mockPointsGet.mockReturnValue(0);
    mockUsedHintGet.mockReturnValue(false);
    mockHasUsedHint.mockResolvedValue(false);
    mockRallyeGet.mockReturnValue({ id: 10, rallye_end: null });
    mockSaveAnswer.mockResolvedValue({ status: 'sent' });
    mockUploadPhotoAnswer.mockResolvedValue({ filePath: '1_2.jpg' });
  });

  it('returns requires_online when no teamId', async () => {
    const result = await submitPhotoAnswerAndAdvance({
      teamId: null,
      questionId: 1,
      pointsAwarded: 5,
      imageUri: '/tmp/photo.jpg',
    });

    expect(result).toEqual({ status: 'requires_online' });
    expect(mockUploadPhotoAnswer).not.toHaveBeenCalled();
    expect(mockGotoNextQuestion).not.toHaveBeenCalled();
  });

  it('returns requires_online when device is offline', async () => {
    mockIsConnected = false;

    const result = await submitPhotoAnswerAndAdvance({
      teamId: 42,
      questionId: 1,
      pointsAwarded: 5,
      imageUri: '/tmp/photo.jpg',
    });

    expect(result).toEqual({ status: 'requires_online' });
    expect(mockUploadPhotoAnswer).not.toHaveBeenCalled();
  });

  it('uploads photo, saves answer, and advances when online', async () => {
    mockPointsGet.mockReturnValue(5);

    const result = await submitPhotoAnswerAndAdvance({
      teamId: 42,
      questionId: 3,
      pointsAwarded: 10,
      imageUri: '/tmp/photo.jpg',
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockUploadPhotoAnswer).toHaveBeenCalledWith({
      imageUri: '/tmp/photo.jpg',
      teamId: 42,
      questionId: 3,
    });
    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 3, 10, '1_2.jpg');
    expect(mockPointsSet).toHaveBeenCalledWith(15);
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('uploads and saves the photo when an end time is set', async () => {
    mockRallyeGet.mockReturnValue({
      id: 10,
      rallye_end: '14:30:00',
    });

    const result = await submitPhotoAnswerAndAdvance({
      teamId: 42,
      questionId: 3,
      pointsAwarded: 10,
      imageUri: '/tmp/photo.jpg',
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockUploadPhotoAnswer).toHaveBeenCalled();
    expect(mockSaveAnswer).toHaveBeenCalled();
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('subtracts one point from a photo answer when the hint was used', async () => {
    mockPointsGet.mockReturnValue(5);
    mockHasUsedHint.mockResolvedValue(true);

    await submitPhotoAnswerAndAdvance({
      teamId: 42,
      questionId: 3,
      pointsAwarded: 10,
      imageUri: '/tmp/photo.jpg',
    });

    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 3, 9, '1_2.jpg');
    expect(mockPointsSet).toHaveBeenCalledWith(14);
  });
});
