const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import {
  castVote,
  getTeamAnswersForQuestions,
  getVotingSourceData,
} from '../votingStorage';

type Result = { data: unknown; error: unknown };

function builder(result: Result) {
  const query: any = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    in: jest.fn(() => query),
    then: (resolve: (value: Result) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return query;
}

describe('votingStorage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads voting source rows and calls the voted-question RPC', async () => {
    const questionRows = [{ question_id: 1, questions: null }];
    const teamRows = [{ id: 2, name: 'Team' }];
    mockFrom.mockImplementation((table: string) =>
      builder({
        data: table === 'teams' ? teamRows : questionRows,
        error: null,
      })
    );
    mockRpc.mockResolvedValue({ data: [{ question_id: 3 }], error: null });

    await expect(getVotingSourceData(7, 2)).resolves.toEqual({
      questionRows,
      teamRows,
      votedQuestionRows: [{ question_id: 3 }],
    });
    expect(mockRpc).toHaveBeenCalledWith('get_voted_voting_question_ids', {
      rallye_id_param: 7,
      voting_team_id_param: 2,
    });
  });

  it('throws when a voting source query fails', async () => {
    const error = new Error('source failed');
    mockFrom.mockImplementation(() => builder({ data: null, error }));
    mockRpc.mockResolvedValue({ data: [], error: null });
    await expect(getVotingSourceData(7, 2)).rejects.toBe(error);
  });

  it('loads team answers for the requested questions and teams', async () => {
    const rows = [{ question_id: 1, team_id: 2, answer: 'A' }];
    const query = builder({ data: rows, error: null });
    mockFrom.mockReturnValue(query);
    await expect(getTeamAnswersForQuestions([1], [2])).resolves.toEqual(rows);
    expect(query.in).toHaveBeenNthCalledWith(1, 'question_id', [1]);
    expect(query.in).toHaveBeenNthCalledWith(2, 'team_id', [2]);
  });

  it('passes exact RPC parameter names when casting a vote', async () => {
    mockRpc.mockResolvedValue({ error: null });
    await castVote({
      rallyeId: 7,
      questionId: 8,
      votingTeamId: 2,
      votedForTeamId: 3,
    });
    expect(mockRpc).toHaveBeenCalledWith('cast_voting_vote', {
      rallye_id_param: 7,
      question_id_param: 8,
      voting_team_id_param: 2,
      voted_for_team_id_param: 3,
    });
  });

  it('throws a vote RPC error', async () => {
    const error = new Error('vote failed');
    mockRpc.mockResolvedValue({ error });
    await expect(
      castVote({
        rallyeId: 7,
        questionId: 8,
        votingTeamId: 2,
        votedForTeamId: 3,
      })
    ).rejects.toBe(error);
  });
});
