import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { store$ } from '@/services/storage/Store';
import RallyeIndex from '../index';

const mockScreenScrollView = jest.fn(
  ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
    <>{children}</>
  )
);
const mockQuestionRenderer = jest.fn((_props: unknown) => null);

// Keep this unit test focused on the CTA callback only.
// We stub useEffect so RallyeIndex mount effects (question/answer/status loading)
// do not schedule async state updates that are irrelevant to this assertion.
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useEffect: jest.fn(),
  };
});

jest.mock('@legendapp/state/react', () => ({
  observer: (component: any) => component,
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params && 'answer' in params
        ? `${key}:${params.answer}`
        : params
          ? `${key}:${params.correct}/${params.total}`
          : key,
  }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({
    text: {},
    muted: {},
    screen: {},
  }),
}));

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
        in: async () => ({ data: [], error: null }),
      }),
    }),
  },
}));

jest.mock('@/utils/GlobalStyles', () => ({
  globalStyles: {
    default: {
      refreshContainer: {},
      container: {},
    },
    rallyeStatesStyles: {
      container: {},
      infoTitle: {},
      infoSubtitle: {},
      meetingPoint: {},
    },
    teamStyles: { title: {} },
  },
}));

jest.mock('@/components/ui/Screen', () => {
  return {
    ScreenScrollView: (props: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => mockScreenScrollView(props),
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

jest.mock('@/components/ui/InfoBox', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/ui/VStack', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/ui/UIButton', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      onPress,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
    }) => <Text onPress={onPress}>{children}</Text>,
  };
});

jest.mock('../states/NoQuestions', () => () => null);
jest.mock('../team-setup', () => () => null);
jest.mock('../voting', () => () => null);
jest.mock('../scoreboard', () => () => null);
jest.mock(
  '../question-renderer',
  () => (props: unknown) => mockQuestionRenderer(props)
);
jest.mock('@/components/rallye/RallyeContextBar', () => () => null);

jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: {
      get: jest.fn(() => ({
        id: 1,
        name: 'Tour Mode',
        status: 'running',
        mode: 'tour',
        rallye_end: null,
      })),
      status: { set: jest.fn() },
      rallye_end: { set: jest.fn() },
      name: { set: jest.fn() },
    },
    team: { get: jest.fn(() => null) },
    questionIndex: { get: jest.fn(() => 0), set: jest.fn() },
    questions: { get: jest.fn(() => []), set: jest.fn() },
    totalQuestions: { get: jest.fn(() => 0), set: jest.fn() },
    answeredCount: { get: jest.fn(() => 0), set: jest.fn() },
    currentQuestion: { get: jest.fn(() => null), set: jest.fn() },
    points: { get: jest.fn(() => 12), set: jest.fn() },
    correctAnswerCount: { get: jest.fn(() => 3), set: jest.fn() },
    tourFeedback: { get: jest.fn(() => null), set: jest.fn() },
    gotoNextQuestion: jest.fn(async () => {}),
    allQuestionsAnswered: { get: jest.fn(() => true), set: jest.fn() },
    isTourMode: { get: jest.fn(() => true) },
    answers: { get: jest.fn(() => []), set: jest.fn() },
    leaveRallye: jest.fn(),
    reset: jest.fn(),
    enabled: { set: jest.fn() },
  },
}));

describe('RallyeIndex', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (store$.rallye.get as jest.Mock).mockReturnValue({
      id: 1,
      name: 'Tour Mode',
      status: 'running',
      mode: 'tour',
      rallye_end: null,
    });
    (store$.team.get as jest.Mock).mockReturnValue(null);
    (store$.questionIndex.get as jest.Mock).mockReturnValue(0);
    (store$.questions.get as jest.Mock).mockReturnValue([]);
    (store$.totalQuestions.get as jest.Mock).mockReturnValue(0);
    (store$.answeredCount.get as jest.Mock).mockReturnValue(0);
    (store$.currentQuestion.get as jest.Mock).mockReturnValue(null);
    (store$.points.get as jest.Mock).mockReturnValue(12);
    (store$.correctAnswerCount.get as jest.Mock).mockReturnValue(3);
    (store$.tourFeedback.get as jest.Mock).mockReturnValue(null);
    (store$.allQuestionsAnswered.get as jest.Mock).mockReturnValue(true);
    (store$.isTourMode.get as jest.Mock).mockReturnValue(true);
    (store$.answers.get as jest.Mock).mockReturnValue([]);
  });

  it('calls leaveRallye when pressing back-to-start in tour completion state', () => {
    const { getByText } = render(<RallyeIndex />);

    fireEvent.press(getByText('rallye.backToStart'));

    expect(store$.leaveRallye).toHaveBeenCalledTimes(1);
    expect(store$.reset).not.toHaveBeenCalled();
    expect(store$.enabled.set).not.toHaveBeenCalled();
  });

  it('shows the rallye name above the waiting message', () => {
    (store$.rallye.get as jest.Mock).mockReturnValue({
      id: 1,
      name: 'Campus Rallye',
      status: 'ready',
      mode: 'classic',
      rallye_end: null,
    });

    const { getByText } = render(<RallyeIndex />);

    expect(getByText('Campus Rallye')).toBeTruthy();
    expect(getByText('rallye.preparing.title')).toBeTruthy();
  });

  it('shows the number of correctly answered questions in tour completion state', () => {
    (store$.correctAnswerCount.get as jest.Mock).mockReturnValue(3);
    (store$.totalQuestions.get as jest.Mock).mockReturnValue(5);

    const { getByText } = render(<RallyeIndex />);

    expect(getByText('rallye.correctAnswers:3/5')).toBeTruthy();
  });

  it('shows the correct tour result until Weiter advances', async () => {
    (store$.allQuestionsAnswered.get as jest.Mock).mockReturnValue(false);
    (store$.questions.get as jest.Mock).mockReturnValue([
      { id: 1, question: 'Q1', question_type: 'knowledge', point_value: 1 },
    ]);
    (store$.tourFeedback.get as jest.Mock).mockReturnValue({
      isCorrect: true,
      correctAnswer: '',
    });

    const { getByText, queryByText } = render(<RallyeIndex />);

    expect(getByText('tour.feedback.correct')).toBeTruthy();
    expect(queryByText('tour.feedback.correctAnswer:')).toBeNull();
    expect(mockQuestionRenderer).not.toHaveBeenCalled();
    expect(store$.gotoNextQuestion).not.toHaveBeenCalled();

    fireEvent.press(getByText('common.next'));

    await waitFor(() => {
      expect(store$.gotoNextQuestion).toHaveBeenCalledTimes(1);
      expect(store$.tourFeedback.set).toHaveBeenCalledWith(null);
    });
  });

  it('shows the correct answer after an incorrect tour response', () => {
    (store$.allQuestionsAnswered.get as jest.Mock).mockReturnValue(false);
    (store$.questions.get as jest.Mock).mockReturnValue([
      { id: 1, question: 'Q1', question_type: 'knowledge', point_value: 1 },
    ]);
    (store$.tourFeedback.get as jest.Mock).mockReturnValue({
      isCorrect: false,
      correctAnswer: 'Bibliothek',
    });

    const { getByText } = render(<RallyeIndex />);

    expect(getByText('tour.feedback.incorrect')).toBeTruthy();
    expect(getByText('tour.feedback.correctAnswer:Bibliothek')).toBeTruthy();
    expect(store$.gotoNextQuestion).not.toHaveBeenCalled();
  });

  it('does not expose pull-to-refresh while answering questions', () => {
    (store$.allQuestionsAnswered.get as jest.Mock).mockReturnValue(false);
    (store$.questions.get as jest.Mock).mockReturnValue([
      { id: 1, question: 'Q1', question_type: 'knowledge', point_value: 1 },
    ]);
    (store$.currentQuestion.get as jest.Mock).mockReturnValue({
      id: 1,
      question: 'Q1',
      question_type: 'knowledge',
      point_value: 1,
    });

    render(<RallyeIndex />);

    const activeQuestionViewProps = mockScreenScrollView.mock.calls.at(-1)?.[0];

    expect(activeQuestionViewProps?.refreshControl).toBeUndefined();
  });

  it('keeps rendering active team questions when an end time is set', () => {
    (store$.rallye.get as jest.Mock).mockReturnValue({
      id: 1,
      name: 'Campus Rallye',
      status: 'running',
      mode: 'classic',
      rallye_end: '14:30:00',
    });
    (store$.team.get as jest.Mock).mockReturnValue({ id: 2, name: 'Team A' });
    (store$.allQuestionsAnswered.get as jest.Mock).mockReturnValue(false);
    (store$.isTourMode.get as jest.Mock).mockReturnValue(false);
    (store$.questions.get as jest.Mock).mockReturnValue([
      { id: 1, question: 'Q1', question_type: 'knowledge', point_value: 1 },
    ]);
    (store$.currentQuestion.get as jest.Mock).mockReturnValue({
      id: 1,
      question: 'Q1',
      question_type: 'knowledge',
      point_value: 1,
    });

    render(<RallyeIndex />);

    expect(mockQuestionRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        question: expect.objectContaining({ id: 1 }),
      })
    );
  });

  it('keeps rendering active tour questions when an end time is set', () => {
    (store$.rallye.get as jest.Mock).mockReturnValue({
      id: 1,
      name: 'Campus Tour',
      status: 'running',
      mode: 'tour',
      rallye_end: '14:30:00',
    });
    (store$.allQuestionsAnswered.get as jest.Mock).mockReturnValue(false);
    (store$.isTourMode.get as jest.Mock).mockReturnValue(true);
    (store$.questions.get as jest.Mock).mockReturnValue([
      { id: 1, question: 'Q1', question_type: 'knowledge', point_value: 1 },
    ]);
    (store$.currentQuestion.get as jest.Mock).mockReturnValue({
      id: 1,
      question: 'Q1',
      question_type: 'knowledge',
      point_value: 1,
    });

    render(<RallyeIndex />);

    expect(mockQuestionRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        question: expect.objectContaining({ id: 1 }),
      })
    );
  });
});
