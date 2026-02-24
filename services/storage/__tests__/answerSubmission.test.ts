import {
  submitAnswerAndAdvance,
  submitPhotoAnswerAndAdvance,
} from '@/services/storage/answerSubmission';

// --- Mocks ---
const mockSaveAnswer = jest.fn();
const mockUploadPhotoAnswer = jest.fn();
jest.mock('@/services/storage/answerStorage', () => ({
  saveAnswer: (...args: unknown[]) => mockSaveAnswer(...args),
  uploadPhotoAnswer: (...args: unknown[]) => mockUploadPhotoAnswer(...args),
}));

const mockPointsGet = jest.fn(() => 0);
const mockPointsSet = jest.fn();
const mockGotoNextQuestion = jest.fn(async () => {});
jest.mock('@/services/storage/Store', () => ({
  store$: {
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
    mockSaveAnswer.mockResolvedValue({ status: 'sent' });
  });

  it('returns "local" and advances without saving when no teamId', async () => {
    const result = await submitAnswerAndAdvance({
      teamId: null,
      questionId: 1,
      answeredCorrectly: true,
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
      answeredCorrectly: true,
      pointsAwarded: 3,
      answerText: 'hello',
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 7, true, 3, 'hello');
    expect(mockPointsSet).toHaveBeenCalledWith(13);
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('does not add points when pointsAwarded is 0 (incorrect answer)', async () => {
    const result = await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      answeredCorrectly: false,
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
      answeredCorrectly: true,
      pointsAwarded: 2,
    });

    expect(result).toEqual({ status: 'queued' });
  });
});

describe('submitPhotoAnswerAndAdvance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = true;
    mockPointsGet.mockReturnValue(0);
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
    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 3, true, 10, '1_2.jpg');
    expect(mockPointsSet).toHaveBeenCalledWith(15);
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });
});
