import React from 'react';
import { Alert, Image } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ImageQuestion from '../ImageQuestion';
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

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://example.test/${path}` },
        }),
      }),
    },
  },
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
  id: 7,
  question: 'Welches Gebäude ist das?',
  question_type: 'picture',
  point_value: 5,
  bucket_path: 'building.jpg',
};

describe('ImageQuestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTeam = { id: 1 };
    mockAnswers = [
      { id: 1, question_id: 7, text: 'Bibliothek', correct: true },
    ];
    jest.mocked(confirmAnswer).mockResolvedValue(true);
    jest.mocked(submitAnswerAndAdvance).mockResolvedValue({ status: 'sent' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the question text', () => {
    const { getByText } = render(<ImageQuestion question={baseQuestion} />);

    expect(getByText('Welches Gebäude ist das?')).toBeTruthy();
  });

  it('renders the question picture from the storage bucket path', () => {
    const { UNSAFE_getByType } = render(
      <ImageQuestion question={baseQuestion} />
    );

    expect(UNSAFE_getByType(Image).props.source.uri).toBe(
      'https://example.test/building.jpg'
    );
  });

  it('renders no picture when the question has no bucket path', () => {
    const { UNSAFE_queryByType } = render(
      <ImageQuestion question={{ ...baseQuestion, bucket_path: undefined }} />
    );

    expect(UNSAFE_queryByType(Image)).toBeNull();
  });

  it('awards the full point value for a correct answer', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ImageQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'Bibliothek'
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() =>
      expect(submitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: 1,
        questionId: 7,
        pointsAwarded: 5,
        answerText: 'Bibliothek',
      })
    );
  });

  it('awards zero points for a wrong answer but still submits', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ImageQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'Mensa'
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() =>
      expect(submitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: 1,
        questionId: 7,
        pointsAwarded: 0,
        answerText: 'Mensa',
      })
    );
  });

  it('grades case-insensitively and ignores surrounding whitespace', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ImageQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      '  bIBLIOTHEK  '
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() =>
      expect(submitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: 1,
        questionId: 7,
        pointsAwarded: 5,
        answerText: 'bIBLIOTHEK',
      })
    );
  });

  it('does not submit when the confirmation is declined', async () => {
    jest.mocked(confirmAnswer).mockResolvedValue(false);
    const { getByPlaceholderText, getByText } = render(
      <ImageQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'Bibliothek'
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() => expect(confirmAnswer).toHaveBeenCalled());
    expect(submitAnswerAndAdvance).not.toHaveBeenCalled();
  });

  it('submits with a null teamId in tour mode', async () => {
    mockTeam = null;
    const { getByPlaceholderText, getByText } = render(
      <ImageQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'Bibliothek'
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() =>
      expect(submitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: null,
        questionId: 7,
        pointsAwarded: 5,
        answerText: 'Bibliothek',
      })
    );
  });

  it('alerts instead of submitting when the answer is empty', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByPlaceholderText } = render(
      <ImageQuestion question={baseQuestion} />
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
      <ImageQuestion question={baseQuestion} />
    );
    const input = getByPlaceholderText('question.placeholder.answer');

    fireEvent.changeText(input, 'Bibliothek');
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
      <ImageQuestion question={baseQuestion} />
    );

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'Bibliothek'
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
