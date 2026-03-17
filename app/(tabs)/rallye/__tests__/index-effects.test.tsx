import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import RallyeIndex from '../index';

let mockTeam: { id: number; name: string } | null = null;
const mockFrom = jest.fn((table: string) => {
  if (table === 'join_rallye_questions') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() =>
          Promise.resolve({
            data: [{ question_id: 1 }],
            error: null,
          })
        ),
      })),
    };
  }

  if (table === 'answers') {
    return {
      select: jest.fn(() => ({
        in: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    };
  }

  if (table === 'team_questions') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          in: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    };
  }

  if (table === 'questions') {
    return {
      select: jest.fn(() => ({
        in: jest.fn(() =>
          Promise.resolve({
            data: [{ id: 1, content: 'Q1', type: 'knowledge' }],
            error: null,
          })
        ),
      })),
    };
  }

  if (table === 'rallye') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { status: 'running', end_time: null, name: 'Rallye 1' },
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

jest.mock('@/components/ui/TeamNameSheet', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <View />,
  };
});

jest.mock('../states/Preparation', () => () => null);
jest.mock('../states/NoQuestions', () => () => null);
jest.mock('../team-setup', () => () => null);
jest.mock('../voting', () => () => null);
jest.mock('../scoreboard', () => () => null);
jest.mock('../question-renderer', () => () => null);

jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: {
      get: jest.fn(() => ({
        id: 1,
        name: 'Department Rallye',
        status: 'running',
        mode: 'department',
        end_time: null,
      })),
      status: { set: jest.fn() },
      end_time: { set: jest.fn() },
      name: { set: jest.fn() },
    },
    team: { get: jest.fn(() => mockTeam) },
    questionIndex: { get: jest.fn(() => 0), set: jest.fn() },
    questions: { get: jest.fn(() => []), set: jest.fn() },
    totalQuestions: { get: jest.fn(() => 0), set: jest.fn() },
    answeredCount: { get: jest.fn(() => 0), set: jest.fn() },
    showTeamNameSheet: { get: jest.fn(() => false), set: jest.fn() },
    currentQuestion: { get: jest.fn(() => null), set: jest.fn() },
    points: { get: jest.fn(() => 0), set: jest.fn() },
    allQuestionsAnswered: { get: jest.fn(() => false), set: jest.fn() },
    timeExpired: { get: jest.fn(() => false), set: jest.fn() },
    isTourMode: { get: jest.fn(() => false) },
    answers: { get: jest.fn(() => []), set: jest.fn() },
  },
}));

function tableCallCount(table: string) {
  return mockFrom.mock.calls.filter(([arg]) => arg === table).length;
}

describe('RallyeIndex effects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTeam = null;
  });

  it('reuses cached question ids and does not re-fetch answers/status on team change', async () => {
    const { rerender } = render(<RallyeIndex />);

    await waitFor(() => {
      expect(tableCallCount('answers')).toBeGreaterThan(0);
      expect(tableCallCount('rallye')).toBeGreaterThan(0);
      expect(tableCallCount('join_rallye_questions')).toBe(1);
    });

    const answersCallsAfterMount = tableCallCount('answers');
    const rallyeCallsAfterMount = tableCallCount('rallye');
    const questionJoinCallsAfterMount = tableCallCount('join_rallye_questions');

    mockTeam = { id: 123, name: 'New Team' };
    rerender(<RallyeIndex />);

    await waitFor(() => {
      expect(tableCallCount('team_questions')).toBeGreaterThan(0);
    });

    expect(tableCallCount('answers')).toBe(answersCallsAfterMount);
    expect(tableCallCount('rallye')).toBe(rallyeCallsAfterMount);
    expect(tableCallCount('join_rallye_questions')).toBe(
      questionJoinCallsAfterMount
    );
  });
});
