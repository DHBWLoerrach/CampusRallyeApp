import React from 'react';
import { Alert } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import RallyeIndex from '../index';
import { store$ } from '@/services/storage/Store';

let mockTeam: { id: number; name: string } | null = null;
let mockJoinQuestionIds = [{ question_id: 1 }];
let mockAnsweredQuestionIds: { question_id: number }[] = [];
let mockQuestionsData = [{ id: 1, content: 'Q1', type: 'knowledge' }];
let mockGeocachingData: {
  data: any[] | null;
  error: Error | null;
} = {
  data: [],
  error: null,
};

const mockFrom = jest.fn((table: string) => {
  if (table === 'rallye_questions') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() =>
          Promise.resolve({
            data: mockJoinQuestionIds,
            error: null,
          })
        ),
      })),
    };
  }

  if (table === 'solution_options') {
    return {
      select: jest.fn(() => ({
        in: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    };
  }

  if (table === 'team_answers') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() =>
          Promise.resolve({ data: mockAnsweredQuestionIds, error: null })
        ),
      })),
    };
  }

  if (table === 'questions') {
    return {
      select: jest.fn(() => ({
        in: jest.fn(() =>
          Promise.resolve({
            data: mockQuestionsData,
            error: null,
          })
        ),
      })),
    };
  }

  if (table === 'geocaching_questions') {
    return {
      select: jest.fn(() => ({
        in: jest.fn(() => Promise.resolve(mockGeocachingData)),
      })),
    };
  }

  if (table === 'rallyes') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { status: 'running', rallye_end: null, name: 'Rallye 1' },
              error: null,
            })
          ),
        })),
      })),
    };
  }

  return {
    select: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      in: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  };
});

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

jest.mock('@legendapp/state/react', () => ({
  observer: (component: unknown) => component,
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({
    text: {},
    muted: {},
    screen: {},
  }),
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
  },
}));

jest.mock('@/components/ui/Screen', () => {
  const { View } = jest.requireActual('react-native');
  return {
    ScreenScrollView: ({ children }: { children: React.ReactNode }) => (
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

jest.mock('../states/Preparation', () => () => null);
jest.mock('../states/NoQuestions', () => () => null);
jest.mock('../team-setup', () => () => null);
jest.mock('../voting', () => () => null);
jest.mock('../scoreboard', () => () => null);
jest.mock('../question-renderer', () => () => null);
jest.mock('@/components/rallye/RallyeContextBar', () => () => null);

jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: {
      get: jest.fn(() => ({
        id: 1,
        name: 'Department Rallye',
        department_id: 1,
        status: 'running',
        mode: 'department',
        rallye_end: null,
      })),
      status: { set: jest.fn() },
      rallye_end: { set: jest.fn() },
      name: { set: jest.fn() },
    },
    team: { get: jest.fn(() => mockTeam) },
    questionIndex: { get: jest.fn(() => 0), set: jest.fn() },
    questions: { get: jest.fn(() => []), set: jest.fn() },
    totalQuestions: { get: jest.fn(() => 0), set: jest.fn() },
    answeredCount: { get: jest.fn(() => 0), set: jest.fn() },
    currentQuestion: { get: jest.fn(() => null), set: jest.fn() },
    points: { get: jest.fn(() => 0), set: jest.fn() },
    allQuestionsAnswered: { get: jest.fn(() => false), set: jest.fn() },
    isTourMode: { get: jest.fn(() => false) },
    answers: { get: jest.fn(() => []), set: jest.fn() },
  },
}));

function tableCallCount(table: string) {
  return mockFrom.mock.calls.filter(([arg]) => arg === table).length;
}

describe('RallyeIndex effects', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTeam = null;
    mockJoinQuestionIds = [{ question_id: 1 }];
    mockAnsweredQuestionIds = [];
    mockQuestionsData = [{ id: 1, content: 'Q1', type: 'knowledge' }];
    mockGeocachingData = { data: [], error: null };
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('reuses cached question ids and does not re-fetch answers/status on team change', async () => {
    const { rerender } = render(<RallyeIndex />);

    await waitFor(() => {
      expect(tableCallCount('solution_options')).toBeGreaterThan(0);
      expect(tableCallCount('rallyes')).toBeGreaterThan(0);
      expect(tableCallCount('rallye_questions')).toBe(1);
    });

    const answersCallsAfterMount = tableCallCount('solution_options');
    const rallyeCallsAfterMount = tableCallCount('rallyes');
    const questionJoinCallsAfterMount = tableCallCount('rallye_questions');

    mockTeam = { id: 123, name: 'New Team' };
    rerender(<RallyeIndex />);

    await waitFor(() => {
      expect(tableCallCount('team_answers')).toBeGreaterThan(0);
    });

    expect(tableCallCount('solution_options')).toBe(answersCallsAfterMount);
    expect(tableCallCount('rallyes')).toBe(rallyeCallsAfterMount);
    expect(tableCallCount('rallye_questions')).toBe(
      questionJoinCallsAfterMount
    );
  });

  it('clears the stored rallye end when the refreshed rallye has none', async () => {
    render(<RallyeIndex />);

    await waitFor(() => {
      expect(store$.rallye.rallye_end.set).toHaveBeenCalledWith(null);
    });
  });

  it('shows a load error instead of silently loading geocaching without metadata', async () => {
    mockJoinQuestionIds = [{ question_id: 2 }];
    mockQuestionsData = [{ id: 2, content: 'Geo', type: 'geocaching' }];
    mockGeocachingData = {
      data: null,
      error: new Error('geocaching_questions failed'),
    };

    render(<RallyeIndex />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'common.errorTitle',
        'rallye.error.loadQuestions'
      );
    });

    expect(tableCallCount('geocaching_questions')).toBeGreaterThan(0);
    expect(store$.questions.set).not.toHaveBeenCalled();
    expect(store$.currentQuestion.set).not.toHaveBeenCalled();
  });

  it('preserves the active question order and selection when answered items disappear on refresh', async () => {
    mockTeam = { id: 7, name: 'Team 7' };
    mockJoinQuestionIds = [
      { question_id: 1 },
      { question_id: 2 },
      { question_id: 3 },
    ];
    mockAnsweredQuestionIds = [{ question_id: 1 }];
    mockQuestionsData = [
      { id: 2, content: 'Q2', type: 'knowledge' },
      { id: 3, content: 'Q3', type: 'multiple_choice' },
    ];

    (store$.questions.get as jest.Mock).mockImplementation(() => [
      { id: 1, question: 'Q1', question_type: 'knowledge', point_value: 1 },
      {
        id: 3,
        question: 'Q3',
        question_type: 'multiple_choice',
        point_value: 1,
      },
      { id: 2, question: 'Q2', question_type: 'knowledge', point_value: 1 },
    ]);
    (store$.currentQuestion.get as jest.Mock).mockImplementation(() => ({
      id: 2,
      question: 'Q2',
      question_type: 'knowledge',
      point_value: 1,
    }));

    render(<RallyeIndex />);

    await waitFor(() => {
      expect(store$.questions.set).toHaveBeenCalled();
      expect(store$.questionIndex.set).toHaveBeenCalledWith(1);
    });

    const orderedQuestions = (store$.questions.set as jest.Mock).mock.calls.at(
      -1
    )?.[0];
    const currentQuestion = (
      store$.currentQuestion.set as jest.Mock
    ).mock.calls.at(-1)?.[0];

    expect(
      orderedQuestions.map((question: { id: number }) => question.id)
    ).toEqual([3, 2]);
    expect(currentQuestion?.id).toBe(2);
  });
});
