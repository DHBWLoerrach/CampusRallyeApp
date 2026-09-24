import {
  getTeamProgress,
  saveAnswer,
  uploadPhotoAnswer,
} from '@/services/storage/answerStorage';

const mockFrom = jest.fn();
const mockUpsert = jest.fn();
const mockEnqueueSaveAnswer = jest.fn();
const mockGetQueuedAnswers = jest.fn();
const mockStorageFrom = jest.fn();
const mockUpload = jest.fn();
const mockPreparePhotoUpload = jest.fn();

jest.mock('../preparePhotoUpload', () => ({
  preparePhotoUpload: (...args: unknown[]) => mockPreparePhotoUpload(...args),
}));

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: (...args: unknown[]) => mockStorageFrom(...args) },
  },
}));

jest.mock('@/services/storage/offlineOutbox', () => ({
  enqueueSaveAnswer: (...args: unknown[]) => mockEnqueueSaveAnswer(...args),
  getQueuedAnswers: (...args: unknown[]) => mockGetQueuedAnswers(...args),
}));

describe('getTeamProgress', () => {
  function mockStoredAnswers(result: { data: unknown; error: unknown }) {
    const eq = jest.fn().mockResolvedValue(result);
    mockFrom.mockReturnValue({ select: jest.fn(() => ({ eq })) });
    return eq;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetQueuedAnswers.mockResolvedValue([]);
  });

  it('sums stored and still queued points of the team', async () => {
    const eq = mockStoredAnswers({
      data: [
        { question_id: 1, team_points: 3 },
        { question_id: 2, team_points: 0 },
      ],
      error: null,
    });
    mockGetQueuedAnswers.mockResolvedValue([
      { team_id: 7, question_id: 3, team_points: 4, answer: 'queued' },
    ]);

    await expect(getTeamProgress(7)).resolves.toMatchObject({ points: 7 });
    expect(mockFrom).toHaveBeenCalledWith('team_answers');
    expect(eq).toHaveBeenCalledWith('team_id', 7);
    expect(mockGetQueuedAnswers).toHaveBeenCalledWith(7);
  });

  it('treats still queued answers as answered', async () => {
    mockStoredAnswers({
      data: [{ question_id: 1, team_points: 3 }],
      error: null,
    });
    mockGetQueuedAnswers.mockResolvedValue([
      { team_id: 7, question_id: 1, team_points: 3, answer: 'synced' },
      { team_id: 7, question_id: 2, team_points: 0, answer: 'queued' },
    ]);

    const { answeredQuestionIds } = await getTeamProgress(7);

    expect([...answeredQuestionIds].sort()).toEqual([1, 2]);
  });

  it('counts the stored points when an answer is also still queued', async () => {
    mockStoredAnswers({
      data: [{ question_id: 1, team_points: 2 }],
      error: null,
    });
    mockGetQueuedAnswers.mockResolvedValue([
      { team_id: 7, question_id: 1, team_points: 5, answer: 'duplicate' },
    ]);

    await expect(getTeamProgress(7)).resolves.toMatchObject({ points: 2 });
  });

  it('keeps an answer that is synchronized while the progress loads', async () => {
    const answer = {
      team_id: 7,
      question_id: 1,
      team_points: 3,
      answer: 'A',
    };
    let synced = false;
    // The outbox moves the answer to the server right after the first read.
    const readAfterSync = <T>(before: T, after: T) => {
      const result = synced ? after : before;
      synced = true;
      return Promise.resolve(result);
    };
    const eq = jest.fn(() =>
      readAfterSync(
        { data: [], error: null },
        { data: [{ question_id: 1, team_points: 3 }], error: null }
      )
    );
    mockFrom.mockReturnValue({ select: jest.fn(() => ({ eq })) });
    mockGetQueuedAnswers.mockImplementation(() => readAfterSync([answer], []));

    await expect(getTeamProgress(7)).resolves.toEqual({
      answeredQuestionIds: [1],
      points: 3,
    });
  });

  it('throws when the stored answers cannot be loaded', async () => {
    const error = new Error('offline');
    mockStoredAnswers({ data: null, error });

    await expect(getTeamProgress(7)).rejects.toBe(error);
  });
});

describe('saveAnswer', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
    });
    mockUpsert.mockResolvedValue({ error: null });
    mockEnqueueSaveAnswer.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('writes idempotently via upsert on team and question', async () => {
    const result = await saveAnswer(7, 13, 5, 'foo');

    expect(mockFrom).toHaveBeenCalledWith('team_answers');
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        team_id: 7,
        question_id: 13,
        team_points: 5,
        answer: 'foo',
      },
      { onConflict: 'team_id,question_id', ignoreDuplicates: true }
    );
    expect(result).toEqual({ status: 'sent' });
  });

  it('enqueues payload when upsert fails', async () => {
    mockUpsert.mockResolvedValue({
      error: new Error('network unavailable'),
    });

    const result = await saveAnswer(7, 13, 0, 'bar');

    expect(mockEnqueueSaveAnswer).toHaveBeenCalledWith({
      team_id: 7,
      question_id: 13,
      team_points: 0,
      answer: 'bar',
    });
    expect(result).toEqual({ status: 'queued' });
  });

  it('reports a deleted team instead of enqueueing the answer', async () => {
    mockUpsert.mockResolvedValue({
      error: {
        code: '23503',
        message:
          'insert or update on table "team_answers" violates foreign key constraint "team_answers_team_id_fkey"',
      },
    });

    const result = await saveAnswer(7, 13, 5, 'foo');

    expect(mockEnqueueSaveAnswer).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'team_missing' });
  });
});

describe('uploadPhotoAnswer', () => {
  const options = {
    imageUri: 'file://original.jpg',
    teamId: 7,
    questionId: 13,
  };
  const processedBytes = new Uint8Array([255, 216, 255, 217]);

  beforeEach(() => {
    jest.clearAllMocks();
    mockPreparePhotoUpload.mockResolvedValue(processedBytes);
    mockStorageFrom.mockReturnValue({ upload: mockUpload });
    mockUpload.mockResolvedValue({ error: null });
  });

  it('uploads the prepared JPEG bytes with the existing team/question path', async () => {
    await expect(uploadPhotoAnswer(options)).resolves.toEqual({
      filePath: '7_13.jpg',
    });

    expect(mockPreparePhotoUpload).toHaveBeenCalledWith(options.imageUri);
    expect(mockStorageFrom).toHaveBeenCalledWith('upload-photos');
    expect(mockUpload).toHaveBeenCalledWith('7_13.jpg', processedBytes, {
      upsert: false,
      contentType: 'image/jpeg',
    });
  });

  it('does not upload if photo preparation fails', async () => {
    mockPreparePhotoUpload.mockRejectedValue(new Error('Photo exceeds 10 MB'));

    await expect(uploadPhotoAnswer(options)).rejects.toThrow(
      'Photo exceeds 10 MB'
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('still treats an already uploaded photo as a successful retry', async () => {
    mockUpload.mockResolvedValue({
      error: { message: 'The resource already exists' },
    });

    await expect(uploadPhotoAnswer(options)).resolves.toEqual({
      filePath: '7_13.jpg',
    });
  });

  it('propagates other upload errors', async () => {
    mockUpload.mockResolvedValue({ error: new Error('Network failure') });

    await expect(uploadPhotoAnswer(options)).rejects.toThrow('Network failure');
  });
});
