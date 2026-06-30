import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import MultipleChoiceQuestion from '../MultipleChoiceQuestion';
import type { Question } from '@/types/rallye';

jest.mock('@/services/storage/answerSubmission', () => ({
  submitAnswerAndAdvance: jest.fn(),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { get: jest.fn(() => ({ id: 1 })) },
    answers: {
      get: jest.fn(() => [
        {
          id: 1,
          question_id: 42,
          text: 'Weisse Bambustassen',
          correct: true,
        },
        {
          id: 2,
          question_id: 42,
          text: 'Weisse Plastiktassen',
          correct: false,
        },
      ]),
    },
  },
}));

jest.mock('@legendapp/state/react', () => ({
  observer: (component: unknown) => component,
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ text: {}, infoBox: {} }),
}));

jest.mock('@/utils/ConfirmAlert', () => ({
  confirmAnswer: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/components/themed/ThemedScrollView', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    const { View } = jest.requireActual('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/components/themed/ThemedView', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    const { View } = jest.requireActual('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/components/themed/ThemedText', () => ({
  __esModule: true,
  default: ({
    children,
    style,
  }: {
    children: React.ReactNode;
    style?: unknown;
  }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text style={style}>{children}</Text>;
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
  default: ({ children }: { children: React.ReactNode }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{children}</Text>;
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
  question: 'Gibt es Mehrwegtassen?',
  question_type: 'multiple_choice',
  points: 10,
};

describe('MultipleChoiceQuestion', () => {
  it('lets long option text shrink without forcing short options to grow', () => {
    const { getByText } = render(
      <MultipleChoiceQuestion question={baseQuestion} />
    );

    const option = getByText('Weisse Plastiktassen');
    const style = StyleSheet.flatten(option.props.style);
    expect(style).toEqual(
      expect.objectContaining({
        flexBasis: 'auto',
        flexShrink: 1,
      })
    );
    expect(style).not.toHaveProperty('flex');
  });
});
