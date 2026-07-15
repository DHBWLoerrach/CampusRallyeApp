import React from 'react';
import { render } from '@testing-library/react-native';
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

  it('renders the question text', () => {
    const { getByText } = render(<SkillQuestion question={baseQuestion} />);

    expect(getByText('Wie viele Studiengänge gibt es?')).toBeTruthy();
  });
});
