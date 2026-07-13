import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert, StyleSheet } from 'react-native';

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

const mockSubmitAnswerAndAdvance = jest.fn();
const mockGotoNextQuestion = jest.fn();

jest.mock('@/services/storage/answerSubmission', () => ({
  submitAnswerAndAdvance: (...args: unknown[]) =>
    mockSubmitAnswerAndAdvance(...args),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { get: jest.fn(() => ({ id: 7 })) },
    gotoNextQuestion: (...args: unknown[]) => mockGotoNextQuestion(...args),
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
      disabled,
      loading,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      disabled?: boolean;
      loading?: boolean;
    }) => (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
      >
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
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    springCallbacks.length = 0;
    mockSubmitAnswerAndAdvance.mockResolvedValue({ status: 'sent' });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it.each([
    ['knowledge', 'SkillQuestion'],
    ['upload', 'UploadPhotoQuestion'],
    ['qr_code', 'QRCodeQuestion'],
    ['multiple_choice', 'MultipleChoiceQuestion'],
    ['picture', 'ImageQuestion'],
    ['geocaching', 'GeocachingQuestion'],
  ])('renders %s question type as %s component', (type, componentName) => {
    const question = {
      id: 1,
      question_type: type,
      question: 'Q1',
      point_value: 5,
    };

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
      point_value: 5,
    };

    const { getAllByText } = render(<QuestionRenderer question={question} />);

    expect(
      getAllByText('question.unknown.title').length
    ).toBeGreaterThanOrEqual(1);
    expect(getAllByText('question.skip').length).toBeGreaterThanOrEqual(1);
  });

  it('shows unknown type fallback when question_type is undefined', () => {
    const question = { id: 1, question: 'Q1', point_value: 5 };

    const { getAllByText } = render(<QuestionRenderer question={question} />);

    expect(
      getAllByText('question.unknown.title').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('persists an unknown-type skip before advancing', async () => {
    const question = {
      id: 12,
      question_type: 'nonexistent_type',
      question: 'Q1',
      point_value: 5,
    };
    const { getByText } = render(<QuestionRenderer question={question} />);

    fireEvent.press(getByText('question.skip'));

    await waitFor(() =>
      expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: 7,
        questionId: 12,
        pointsAwarded: 0,
      })
    );
    expect(mockGotoNextQuestion).not.toHaveBeenCalled();
  });

  it('suppresses duplicate unknown-type skip submissions while pending', async () => {
    let resolveSubmission: ((value: { status: 'sent' }) => void) | undefined;
    mockSubmitAnswerAndAdvance.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmission = resolve;
        })
    );
    const { getByText } = render(
      <QuestionRenderer
        question={{ id: 12, question_type: 'nonexistent_type' }}
      />
    );
    const skipButton = getByText('question.skip');

    fireEvent.press(skipButton);
    fireEvent.press(skipButton);

    expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    await act(async () => resolveSubmission?.({ status: 'sent' }));
  });

  it('alerts and keeps an unknown question visible when skip persistence fails', async () => {
    mockSubmitAnswerAndAdvance.mockRejectedValue(new Error('save failed'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(
      <QuestionRenderer
        question={{ id: 12, question_type: 'nonexistent_type' }}
      />
    );

    fireEvent.press(getByText('question.skip'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'common.errorTitle',
        'question.error.saveAnswer'
      )
    );
    expect(getByText('question.unknown.title')).toBeTruthy();
    expect(mockGotoNextQuestion).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('does not submit or advance an unknown question without a numeric ID', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(
      <QuestionRenderer
        question={{ id: 'invalid', question_type: 'nonexistent_type' }}
      />
    );

    fireEvent.press(getByText('question.skip'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(mockSubmitAnswerAndAdvance).not.toHaveBeenCalled();
    expect(mockGotoNextQuestion).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('keeps the new question visible after flip completes', () => {
    const q1 = {
      id: 1,
      question_type: 'knowledge',
      question: 'Q1',
      point_value: 5,
    };
    const q2 = {
      id: 2,
      question_type: 'picture',
      question: 'Q2',
      point_value: 5,
    };

    const { getByTestId, getByText, queryByTestId, queryByText, rerender } =
      render(<QuestionRenderer question={q1} />);

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
    const q1 = {
      id: 1,
      question_type: 'knowledge',
      question: 'Q1',
      point_value: 5,
    };
    const q2 = {
      id: 2,
      question_type: 'picture',
      question: 'Q2',
      point_value: 5,
    };

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
