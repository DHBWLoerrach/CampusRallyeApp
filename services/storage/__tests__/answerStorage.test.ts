import { saveAnswer } from '@/services/storage/answerStorage';

const mockFrom = jest.fn();
const mockUpsert = jest.fn();
const mockEnqueueSaveAnswer = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
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
    const result = await saveAnswer(7, 13, true, 5, 'foo');

    expect(mockFrom).toHaveBeenCalledWith('team_answers');
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        team_id: 7,
        question_id: 13,
        correct: true,
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

    const result = await saveAnswer(7, 13, false, 0, 'bar');

    expect(mockEnqueueSaveAnswer).toHaveBeenCalledWith({
      team_id: 7,
      question_id: 13,
      correct: false,
      team_points: 0,
      answer: 'bar',
    });
    expect(result).toEqual({ status: 'queued' });
  });
});
