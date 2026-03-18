import React from 'react';
import { act, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

const springCallbacks: ((finished?: boolean) => void)[] = [];

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated/mock');
  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    runOnJS: (fn: unknown) => fn,
    withSpring: (
      toValue: unknown,
      _config?: unknown,
      callback?: (finished?: boolean) => void
    ) => {
      if (callback) {
        springCallbacks.push(callback);
      }
      return toValue;
    },
  };
});

const QuestionRenderer = jest.requireActual('../question-renderer').default;

// -- Mocks -------------------------------------------------------------------

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    gotoNextQuestion: jest.fn(),
  },
}));

jest.mock('@/components/themed/ThemedView', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/themed/ThemedText', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
  };
});

jest.mock('@/components/ui/UIButton', () => {
  const { Text, Pressable } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      onPress,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
    }) => (
      <Pressable onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});

// Mock all question components as simple stubs
const mockComponents: Record<string, jest.Mock> = {};
for (const type of [
  'knowledge',
  'upload',
  'qr_code',
  'multiple_choice',
  'picture',
  'geocaching',
]) {
  mockComponents[type] = jest.fn(() => null);
}

jest.mock('@/components/rallye/questions/SkillQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.knowledge(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>SkillQuestion</Text>;
  },
}));

jest.mock('@/components/rallye/questions/UploadPhotoQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.upload(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>UploadPhotoQuestion</Text>;
  },
}));

jest.mock('@/components/rallye/questions/QRCodeQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.qr_code(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>QRCodeQuestion</Text>;
  },
}));

jest.mock('@/components/rallye/questions/MultipleChoiceQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.multiple_choice(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>MultipleChoiceQuestion</Text>;
  },
}));

jest.mock('@/components/rallye/questions/ImageQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.picture(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>ImageQuestion</Text>;
  },
}));

jest.mock('@/components/rallye/questions/GeocachingQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.geocaching(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>GeocachingQuestion</Text>;
  },
}));

// -- Tests --------------------------------------------------------------------

describe('QuestionRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    springCallbacks.length = 0;
  });

  it.each([
    ['knowledge', 'SkillQuestion'],
    ['upload', 'UploadPhotoQuestion'],
    ['qr_code', 'QRCodeQuestion'],
    ['multiple_choice', 'MultipleChoiceQuestion'],
    ['picture', 'ImageQuestion'],
    ['geocaching', 'GeocachingQuestion'],
  ])('renders %s question type as %s component', (type, componentName) => {
    const question = { id: 1, question_type: type, question: 'Q1', points: 5 };

    const { getByText, queryAllByText } = render(
      <QuestionRenderer question={question} />
    );

    expect(getByText(componentName)).toBeTruthy();
    expect(queryAllByText(componentName)).toHaveLength(1);
    expect(mockComponents[type]).toHaveBeenCalledWith(
      expect.objectContaining({ question })
    );
    expect(mockComponents[type]).toHaveBeenCalledTimes(1);
  });

  it('shows unknown type fallback with skip button for invalid type', () => {
    const question = {
      id: 1,
      question_type: 'nonexistent_type',
      question: 'Q1',
      points: 5,
    };

    const { getAllByText } = render(<QuestionRenderer question={question} />);

    expect(getAllByText('question.unknown.title').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('question.skip').length).toBeGreaterThanOrEqual(1);
  });

  it('shows unknown type fallback when question_type is undefined', () => {
    const question = { id: 1, question: 'Q1', points: 5 };

    const { getAllByText } = render(<QuestionRenderer question={question} />);

    expect(getAllByText('question.unknown.title').length).toBeGreaterThanOrEqual(1);
  });

  it('keeps the new question visible after flip completes', () => {
    const q1 = { id: 1, question_type: 'knowledge', question: 'Q1', points: 5 };
    const q2 = { id: 2, question_type: 'picture', question: 'Q2', points: 5 };

    const { getByTestId, getByText, queryByTestId, queryByText, rerender } = render(
      <QuestionRenderer question={q1} />
    );

    // New question triggers flip — both faces mounted during animation
    rerender(<QuestionRenderer question={q2} />);
    expect(getByText('SkillQuestion')).toBeTruthy();
    expect(getByText('ImageQuestion')).toBeTruthy();

    const frontFaceDuringFlip = StyleSheet.flatten(
      getByTestId('question-face-front').props.style
    );
    const backFaceDuringFlip = StyleSheet.flatten(
      getByTestId('question-face-back').props.style
    );

    expect(frontFaceDuringFlip?.position).toBeUndefined();
    expect(backFaceDuringFlip?.position).toBe('absolute');

    // Animation completes — old face unmounts, new question stays visible
    act(() => {
      springCallbacks.at(-1)?.(true);
    });

    expect(getByText('ImageQuestion')).toBeTruthy();
    expect(queryByText('SkillQuestion')).toBeNull();
    expect(queryByTestId('question-face-front')).toBeNull();

    const activeFaceAfterFlip = StyleSheet.flatten(
      getByTestId('question-face-back').props.style
    );
    expect(activeFaceAfterFlip?.position).toBeUndefined();
  });

  it('keeps both faces mounted when a flip spring is canceled', () => {
    const q1 = { id: 1, question_type: 'knowledge', question: 'Q1', points: 5 };
    const q2 = { id: 2, question_type: 'picture', question: 'Q2', points: 5 };

    const { getByTestId, getByText, rerender } = render(
      <QuestionRenderer question={q1} />
    );

    rerender(<QuestionRenderer question={q2} />);
    expect(getByText('SkillQuestion')).toBeTruthy();
    expect(getByText('ImageQuestion')).toBeTruthy();

    act(() => {
      springCallbacks.at(-1)?.(false);
    });

    expect(getByTestId('question-face-front')).toBeTruthy();
    expect(getByTestId('question-face-back')).toBeTruthy();
    expect(getByText('SkillQuestion')).toBeTruthy();
    expect(getByText('ImageQuestion')).toBeTruthy();
  });
});
