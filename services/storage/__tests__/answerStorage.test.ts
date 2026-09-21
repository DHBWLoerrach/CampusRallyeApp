import {
  saveAnswer,
  uploadPhotoAnswer,
} from '@/services/storage/answerStorage';

const mockFrom = jest.fn();
const mockUpsert = jest.fn();
const mockEnqueueSaveAnswer = jest.fn();
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
}));

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
