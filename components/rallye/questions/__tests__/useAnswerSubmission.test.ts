import { Alert } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useAnswerSubmission } from '../useAnswerSubmission';
import type { Question } from '@/types/rallye';
import { submitAnswerAndAdvance } from '@/services/storage/answerSubmission';
import { confirm } from '@/utils/ConfirmAlert';

jest.mock('@/services/storage/answerSubmission', () => ({
  submitAnswerAndAdvance: jest.fn(),
}));

let mockTeam: { id: number } | null = { id: 1 };
jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { get: () => mockTeam },
  },
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/utils/ConfirmAlert', () => ({
  confirm: jest.fn(() => Promise.resolve(true)),
}));

const question: Question = {
  id: 42,
  question: 'Test question',
  question_type: 'knowledge',
  point_value: 10,
};

describe('useAnswerSubmission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTeam = { id: 1 };
    jest.mocked(confirm).mockResolvedValue(true);
    jest.mocked(submitAnswerAndAdvance).mockResolvedValue({ status: 'sent' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('submits the full point value for a correct answer', async () => {
    const { result } = renderHook(() => useAnswerSubmission(question));
    let submitted = false;

    await act(async () => {
      submitted = await result.current.submit({
        isCorrect: true,
        answerText: 'x',
      });
    });

    expect(submitAnswerAndAdvance).toHaveBeenCalledWith({
      teamId: 1,
      questionId: 42,
      pointsAwarded: 10,
      answerText: 'x',
    });
    expect(submitted).toBe(true);
  });

  it('submits zero points for an incorrect answer', async () => {
    const { result } = renderHook(() => useAnswerSubmission(question));
    let submitted = false;

    await act(async () => {
      submitted = await result.current.submit({
        isCorrect: false,
        answerText: 'x',
      });
    });

    expect(submitAnswerAndAdvance).toHaveBeenCalledWith({
      teamId: 1,
      questionId: 42,
      pointsAwarded: 0,
      answerText: 'x',
    });
    expect(submitted).toBe(true);
  });

  it('submits with a null team ID in tour mode', async () => {
    mockTeam = null;
    const { result } = renderHook(() => useAnswerSubmission(question));

    await act(async () => {
      await result.current.submit({ isCorrect: true, answerText: 'x' });
    });

    expect(submitAnswerAndAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ teamId: null })
    );
  });

  it('returns false and shows the default error when submission fails', async () => {
    jest
      .mocked(submitAnswerAndAdvance)
      .mockRejectedValueOnce(new Error('save failed'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useAnswerSubmission(question));
    let submitted = true;

    await act(async () => {
      submitted = await result.current.submit({ isCorrect: true });
    });

    expect(submitted).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith(
      'common.errorTitle',
      'question.error.saveAnswer'
    );
  });

  it('shows a custom error when submission fails', async () => {
    jest
      .mocked(submitAnswerAndAdvance)
      .mockRejectedValueOnce(new Error('save failed'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useAnswerSubmission(question));

    await act(async () => {
      await result.current.submit({
        isCorrect: false,
        errorMessageKey: 'question.error.surrender',
      });
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'common.errorTitle',
      'question.error.surrender'
    );
  });

  it('submits zero points after surrender is confirmed', async () => {
    const { result } = renderHook(() => useAnswerSubmission(question));
    let surrendered = false;

    await act(async () => {
      surrendered = await result.current.surrender();
    });

    expect(confirm).toHaveBeenCalledWith({
      title: 'confirm.surrender.title',
      message: 'confirm.surrender.message',
      confirmText: 'confirm.surrender.confirm',
      cancelText: 'common.cancel',
      destructive: true,
    });
    expect(submitAnswerAndAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ pointsAwarded: 0 })
    );
    expect(surrendered).toBe(true);
  });

  it('does not submit when surrender is declined', async () => {
    jest.mocked(confirm).mockResolvedValue(false);
    const { result } = renderHook(() => useAnswerSubmission(question));
    let surrendered = true;

    await act(async () => {
      surrendered = await result.current.surrender();
    });

    expect(submitAnswerAndAdvance).not.toHaveBeenCalled();
    expect(surrendered).toBe(false);
  });

  it('runs the confirmed callback before submitting surrender', async () => {
    const calls: string[] = [];
    jest.mocked(confirm).mockImplementationOnce(async () => {
      calls.push('confirm');
      return true;
    });
    jest.mocked(submitAnswerAndAdvance).mockImplementationOnce(async () => {
      calls.push('submit');
      return { status: 'sent' };
    });
    const onConfirmed = jest.fn(() => calls.push('onConfirmed'));
    const { result } = renderHook(() => useAnswerSubmission(question));

    await act(async () => {
      await result.current.surrender({ onConfirmed });
    });

    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['confirm', 'onConfirmed', 'submit']);
  });

  it('prevents concurrent surrender submissions before React rerenders', async () => {
    let resolveSubmission: (() => void) | undefined;
    jest.mocked(submitAnswerAndAdvance).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSubmission = () => resolve({ status: 'sent' });
        })
    );
    const { result } = renderHook(() => useAnswerSubmission(question));

    let outcomes: boolean[] = [];
    await act(async () => {
      const first = result.current.surrender();
      const second = result.current.surrender();
      await Promise.resolve();
      await Promise.resolve();

      expect(submitAnswerAndAdvance).toHaveBeenCalledTimes(1);
      resolveSubmission?.();
      outcomes = await Promise.all([first, second]);
    });

    expect(outcomes).toEqual(expect.arrayContaining([true, false]));
  });
});
