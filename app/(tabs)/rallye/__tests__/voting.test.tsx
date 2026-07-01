import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Voting from '../voting';

type EqFilter = {
  type: 'eq';
  column: string;
  value: unknown;
};

type InFilter = {
  type: 'in';
  column: string;
  value: unknown[];
};

type SelectFilter = EqFilter | InFilter;

type SelectCall = {
  table: string;
  columns: string;
  filters: SelectFilter[];
};

type RpcCall = {
  name: string;
  params: Record<string, unknown>;
};

type Fixtures = {
  joinRows: {
    rallye_id: number;
    question_id: number;
    is_voting: boolean;
    questions: { id: number; content: string; type: string };
  }[];
  teamRows: {
    id: number;
    rallye_id: number;
    name: string;
  }[];
  answerRows: {
    question_id: number;
    team_id: number;
    team_answer: string | null;
  }[];
  votedQuestions: {
    question_id: number;
  }[];
  voteError: { message: string } | null;
};

const mockFrom = jest.fn();
const mockRpc = jest.fn();
const selectCalls: SelectCall[] = [];
const rpcCalls: RpcCall[] = [];
let fixtures: Fixtures;

let mockRallye = { id: 1 };
let mockTeam = { id: 2 };

function applyFilters<T extends Record<string, any>>(
  rows: T[],
  filters: SelectFilter[]
): T[] {
  return filters.reduce((current, filter) => {
    if (filter.type === 'eq') {
      return current.filter((row) => row[filter.column] === filter.value);
    }
    return current.filter((row) =>
      (filter.value || []).includes(row[filter.column])
    );
  }, rows);
}

function resolveSelectResult(table: string, filters: SelectFilter[]) {
  if (table === 'join_rallye_questions') {
    return applyFilters(fixtures.joinRows, filters);
  }
  if (table === 'rallye_team') {
    return applyFilters(fixtures.teamRows, filters);
  }
  if (table === 'team_questions') {
    return applyFilters(fixtures.answerRows, filters);
  }
  return [];
}

function createSelectBuilder(table: string, columns: string) {
  const filters: SelectFilter[] = [];
  const builder = {
    eq(column: string, value: unknown) {
      filters.push({ type: 'eq', column, value });
      return builder;
    },
    in(column: string, value: unknown[]) {
      filters.push({ type: 'in', column, value });
      return builder;
    },
    then(
      resolve: (value: { data: unknown[]; error: null }) => unknown,
      reject?: (reason?: unknown) => unknown
    ) {
      selectCalls.push({ table, columns, filters: [...filters] });
      return Promise.resolve({
        data: resolveSelectResult(table, filters),
        error: null,
      }).then(resolve, reject);
    },
  };
  return builder;
}

function baseFixtures(): Fixtures {
  return {
    joinRows: [
      {
        rallye_id: 1,
        question_id: 101,
        is_voting: true,
        questions: { id: 101, content: 'Question 1', type: 'knowledge' },
      },
      {
        rallye_id: 1,
        question_id: 102,
        is_voting: true,
        questions: { id: 102, content: 'Question 2', type: 'knowledge' },
      },
      {
        rallye_id: 1,
        question_id: 999,
        is_voting: false,
        questions: { id: 999, content: 'Non voting question', type: 'knowledge' },
      },
    ],
    teamRows: [
      { id: 2, rallye_id: 1, name: 'Own Team' },
      { id: 3, rallye_id: 1, name: 'Team A' },
      { id: 4, rallye_id: 1, name: 'Team B' },
    ],
    answerRows: [
      { question_id: 101, team_id: 3, team_answer: 'Answer A' },
      { question_id: 101, team_id: 4, team_answer: 'Answer B' },
      { question_id: 102, team_id: 3, team_answer: '    ' },
      { question_id: 102, team_id: 4, team_answer: 'Only one candidate' },
    ],
    votedQuestions: [],
    voteError: null,
  };
}

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: { get: () => mockRallye },
    team: { get: () => mockTeam },
  },
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ text: {}, muted: {} }),
}));

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
    default: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      style?: unknown;
      testID?: string;
    }) => <View {...props}>{children}</View>,
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
      disabled,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      disabled?: boolean;
    }) => <Text onPress={disabled ? undefined : onPress}>{children}</Text>,
  };
});

jest.mock('@/components/ui/Screen', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Screen: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/rallye/RallyeContextBar', () => () => null);

describe('Voting', () => {
  let alertSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    selectCalls.length = 0;
    rpcCalls.length = 0;
    fixtures = baseFixtures();
    mockRallye = { id: 1 };
    mockTeam = { id: 2 };
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockFrom.mockImplementation((table: string) => ({
      select: (columns: string) => createSelectBuilder(table, columns),
    }));

    mockRpc.mockImplementation((name: string, params: Record<string, unknown>) => {
      rpcCalls.push({ name, params });
      if (name === 'get_voted_voting_question_ids') {
        return Promise.resolve({ data: fixtures.votedQuestions, error: null });
      }
      if (name === 'cast_voting_vote') {
        return Promise.resolve({ error: fixtures.voteError });
      }
      return Promise.resolve({ data: [], error: null });
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('loads voting questions from join_rallye_questions with is_voting=true', async () => {
    const { getByText, queryByText } = render(
      <Voting onRefresh={jest.fn()} loading={false} />
    );

    await waitFor(() => {
      expect(getByText('Question 1')).toBeTruthy();
    });

    const joinCall = selectCalls.find(
      (call) => call.table === 'join_rallye_questions'
    );
    expect(joinCall).toBeDefined();
    expect(joinCall?.filters).toContainEqual({
      type: 'eq',
      column: 'is_voting',
      value: true,
    });
    expect(queryByText('Non voting question')).toBeNull();
    expect(rpcCalls).toContainEqual({
      name: 'get_voted_voting_question_ids',
      params: { rallye_id_param: 1, voting_team_id_param: 2 },
    });
    expect(mockRpc).not.toHaveBeenCalledWith(
      'get_voting_content',
      expect.anything()
    );
  });

  it('shows only real-answer candidates and skips questions with fewer than two candidates', async () => {
    const { getByText, getByTestId, queryByText } = render(
      <Voting onRefresh={jest.fn()} loading={false} />
    );

    await waitFor(() => {
      expect(getByText('Question 1')).toBeTruthy();
    });

    expect(queryByText('Only one candidate')).toBeNull();
    fireEvent.press(getByTestId('vote-option-101-3'));
    fireEvent.press(getByText('voting.next'));

    await waitFor(() => {
      expect(getByText('voting.ended.title')).toBeTruthy();
    });

    expect(queryByText('Question 2')).toBeNull();
  });

  it('submits vote via cast_voting_vote RPC', async () => {
    fixtures.joinRows = [fixtures.joinRows[0]];

    const { getByText, getByTestId } = render(
      <Voting onRefresh={jest.fn()} loading={false} />
    );

    await waitFor(() => {
      expect(getByText('Question 1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('vote-option-101-4'));
    fireEvent.press(getByText('voting.next'));

    await waitFor(() => {
      expect(rpcCalls).toContainEqual({
        name: 'cast_voting_vote',
        params: {
          rallye_id_param: 1,
          question_id_param: 101,
          voting_team_id_param: 2,
          voted_for_team_id_param: 4,
        },
      });
    });
  });

  it('shows end state when no votable questions remain', async () => {
    fixtures.votedQuestions = [{ question_id: 101 }, { question_id: 102 }];

    const { getByText } = render(<Voting onRefresh={jest.fn()} loading={false} />);

    await waitFor(() => {
      expect(getByText('voting.ended.title')).toBeTruthy();
    });
  });

  it('ignores a second submit while the vote RPC is in flight', async () => {
    fixtures.joinRows = [
      fixtures.joinRows[0],
      {
        rallye_id: 1,
        question_id: 103,
        is_voting: true,
        questions: { id: 103, content: 'Question 3', type: 'knowledge' },
      },
    ];
    fixtures.answerRows = [
      { question_id: 101, team_id: 3, team_answer: 'Answer A' },
      { question_id: 101, team_id: 4, team_answer: 'Answer B' },
      { question_id: 103, team_id: 3, team_answer: 'Answer C' },
      { question_id: 103, team_id: 4, team_answer: 'Answer D' },
    ];

    let resolveVote: (value: { error: null }) => void = () => {};
    const votePromise = new Promise<{ error: null }>((resolve) => {
      resolveVote = resolve;
    });
    mockRpc.mockImplementation((name: string, params: Record<string, unknown>) => {
      rpcCalls.push({ name, params });
      if (name === 'get_voted_voting_question_ids') {
        return Promise.resolve({ data: fixtures.votedQuestions, error: null });
      }
      if (name === 'cast_voting_vote') {
        return votePromise;
      }
      return Promise.resolve({ data: [], error: null });
    });

    const { getByText, getByTestId, queryByText } = render(
      <Voting onRefresh={jest.fn()} loading={false} />
    );

    await waitFor(() => {
      expect(getByText('Question 1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('vote-option-101-3'));
    fireEvent.press(getByText('voting.next'));
    fireEvent.press(getByText('voting.next'));

    await waitFor(() => {
      expect(rpcCalls.filter((call) => call.name === 'cast_voting_vote')).toHaveLength(
        1
      );
    });

    resolveVote({ error: null });

    await waitFor(() => {
      expect(getByText('Question 3')).toBeTruthy();
    });
    expect(queryByText('voting.ended.title')).toBeNull();
  });

  it('shows an error and keeps the current question when vote RPC fails', async () => {
    fixtures.joinRows = [fixtures.joinRows[0]];
    fixtures.voteError = { message: 'write failed' };

    const { getByText, getByTestId, queryByText } = render(
      <Voting onRefresh={jest.fn()} loading={false} />
    );

    await waitFor(() => {
      expect(getByText('Question 1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('vote-option-101-3'));
    fireEvent.press(getByText('voting.next'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'common.errorTitle',
        'voting.error.submit'
      );
    });

    expect(getByText('Question 1')).toBeTruthy();
    expect(queryByText('voting.ended.title')).toBeNull();
  });

  it('renders geocaching answers as text', async () => {
    fixtures.joinRows = [
      {
        rallye_id: 1,
        question_id: 201,
        is_voting: true,
        questions: {
          id: 201,
          content: 'Find the landmark',
          type: 'geocaching',
        },
      },
    ];
    fixtures.answerRows = [
      { question_id: 201, team_id: 3, team_answer: 'Geocaching Answer A' },
      { question_id: 201, team_id: 4, team_answer: 'Geocaching Answer B' },
    ];

    const { getByText } = render(
      <Voting onRefresh={jest.fn()} loading={false} />
    );

    await waitFor(() => {
      expect(getByText('Geocaching Answer A')).toBeTruthy();
      expect(getByText('Geocaching Answer B')).toBeTruthy();
    });
  });

  it('shows refresh/end view when fewer than 3 teams are available', async () => {
    fixtures.teamRows = [
      { id: 2, rallye_id: 1, name: 'Own Team' },
      { id: 3, rallye_id: 1, name: 'Team A' },
    ];

    const { getByText } = render(<Voting onRefresh={jest.fn()} loading={false} />);

    await waitFor(() => {
      expect(getByText('voting.ended.title')).toBeTruthy();
    });
  });
});
