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
  });

  it('returns "local" and advances without saving when no teamId', async () => {
    const result = await submitAnswerAndAdvance({
      teamId: null,
      questionId: 1,
      pointsAwarded: 5,
    });

    expect(result).toEqual({ status: 'local' });
    expect(mockSaveAnswer).not.toHaveBeenCalled();
    expect(mockPointsSet).toHaveBeenCalledWith(5);
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('saves to backend and adds points when team exists', async () => {
    mockPointsGet.mockReturnValue(10);
    const result = await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      pointsAwarded: 3,
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
    });

    expect(mockHasUsedHint).not.toHaveBeenCalled();
    expect(mockPointsSet).toHaveBeenCalledWith(7);
  });

  it('applies persisted hint use after the in-memory state was reset', async () => {
    mockHasUsedHint.mockResolvedValue(true);

    await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      pointsAwarded: 3,
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
