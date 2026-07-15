import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import SkillQuestion from '../SkillQuestion';
import type { Question } from '@/types/rallye';
import { submitAnswerAndAdvance } from '@/services/storage/answerSubmission';
import { confirmAnswer } from '@/utils/ConfirmAlert';

jest.mock('@/services/storage/answerSubmission', () => ({
  submitAnswerAndAdvance: jest.fn(),
}));

let mockTeam: { id: number } | null = { id: 1 };
let mockAnswers: any[] = [];
jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { get: () => mockTeam },
    answers: { get: () => mockAnswers },
  },
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ text: {} }),
}));

jest.mock('@/utils/ConfirmAlert', () => ({
  confirmAnswer: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/utils/useKeyboard', () => ({
  useKeyboard: () => ({ keyboardHeight: 0, keyboardVisible: false }),
}));

jest.mock('@/components/themed/ThemedScrollView', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    const { View } = jest.requireActual('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/components/themed/ThemedText', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{children}</Text>;
  },
}));

jest.mock('@/components/themed/ThemedTextInput', () => ({
  __esModule: true,
  default: (props: any) => {
    const { TextInput } = jest.requireActual('react-native');
    return <TextInput {...props} />;
  },
}));

jest.mock('@/components/ui/InfoBox', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    const { View } = jest.requireActual('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/components/ui/VStack', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    const { View } = jest.requireActual('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/components/ui/UIButton', () => ({
  __esModule: true,
  default: ({ children, onPress, disabled }: any) => {
    const { Text } = jest.requireActual('react-native');
    return <Text onPress={disabled ? undefined : onPress}>{children}</Text>;
  },
}));

jest.mock('@/components/ui/Hint', () => ({
  __esModule: true,
  default: () => {
    const { View } = jest.requireActual('react-native');
    return <View />;
  },
}));

const baseQuestion: Question = {
  id: 42,
  question: 'Wie viele Studiengänge gibt es?',
  question_type: 'knowledge',
  point_value: 10,
};

describe('SkillQuestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTeam = { id: 1 };
    mockAnswers = [{ id: 1, question_id: 42, text: 'Zwölf', correct: true }];
    jest.mocked(confirmAnswer).mockResolvedValue(true);
    jest.mocked(submitAnswerAndAdvance).mockResolvedValue({ status: 'sent' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the question text', () => {
    const { getByText } = render(<SkillQuestion question={baseQuestion} />);

    expect(getByText('Wie viele Studiengänge gibt es?')).toBeTruthy();
  });

  it('awards the full point value for a correct answer', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SkillQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'Zwölf'
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() =>
      expect(submitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: 1,
        questionId: 42,
        pointsAwarded: 10,
        answerText: 'Zwölf',
      })
    );
  });

  it('awards zero points for a wrong answer but still submits', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SkillQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'Drei'
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() =>
      expect(submitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: 1,
        questionId: 42,
        pointsAwarded: 0,
        answerText: 'Drei',
      })
    );
  });

  it('grades case-insensitively and ignores surrounding whitespace', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SkillQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      '  zWÖLF  '
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() =>
      expect(submitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: 1,
        questionId: 42,
        pointsAwarded: 10,
        answerText: 'zWÖLF',
      })
    );
  });

  it('does not submit when the confirmation is declined', async () => {
    jest.mocked(confirmAnswer).mockResolvedValue(false);
    const { getByPlaceholderText, getByText } = render(
      <SkillQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'Zwölf'
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() => expect(confirmAnswer).toHaveBeenCalled());
    expect(submitAnswerAndAdvance).not.toHaveBeenCalled();
  });

  it('submits with a null teamId in tour mode', async () => {
    mockTeam = null;
    const { getByPlaceholderText, getByText } = render(
      <SkillQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'Zwölf'
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() =>
      expect(submitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: null,
        questionId: 42,
        pointsAwarded: 10,
        answerText: 'Zwölf',
      })
    );
  });

  it('alerts instead of submitting when the answer is empty', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByPlaceholderText } = render(
      <SkillQuestion question={baseQuestion} />
    );

    fireEvent(
      getByPlaceholderText('question.placeholder.answer'),
      'submitEditing'
    );

    expect(alertSpy).toHaveBeenCalledWith(
      'common.errorTitle',
      'question.error.enterAnswer'
    );
    expect(submitAnswerAndAdvance).not.toHaveBeenCalled();
  });

  it('alerts instead of submitting while the answer key is still loading', () => {
    mockAnswers = [];
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByPlaceholderText } = render(
      <SkillQuestion question={baseQuestion} />
    );
    const input = getByPlaceholderText('question.placeholder.answer');

    fireEvent.changeText(input, 'Zwölf');
    fireEvent(input, 'submitEditing');

    expect(alertSpy).toHaveBeenCalledWith(
      'question.error.pleaseWaitTitle',
      'question.error.answerLoading'
    );
    expect(submitAnswerAndAdvance).not.toHaveBeenCalled();
  });

  it('shows an error alert when submission fails', async () => {
    jest
      .mocked(submitAnswerAndAdvance)
      .mockRejectedValueOnce(new Error('save failed'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { getByPlaceholderText, getByText } = render(
      <SkillQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'Zwölf'
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'common.errorTitle',
        'question.error.saveAnswer'
      )
    );
  });
});
