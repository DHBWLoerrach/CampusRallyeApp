const mockFrom = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { getScoreboardData } from '../scoreboardStorage';

const teams = [{ id: 1, name: 'A', created_at: '2024-01-01', play_time: null }];
const points = [{ team_id: 1, team_points: 5 }];

function useResults(teamsResult: unknown, pointsResult: unknown) {
  const teamsEq = jest.fn(() => Promise.resolve(teamsResult));
  const pointsIn = jest.fn(() => Promise.resolve(pointsResult));
  mockFrom.mockImplementation((table: string) => ({
    select: jest.fn(() =>
      table === 'teams' ? { eq: teamsEq } : { in: pointsIn }
    ),
  }));
  return { teamsEq, pointsIn };
}

describe('scoreboardStorage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads teams and their points with the existing constraints', async () => {
    const { teamsEq, pointsIn } = useResults(
      { data: teams, error: null },
      { data: points, error: null }
    );

    await expect(getScoreboardData(7)).resolves.toEqual({ teams, points });
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'teams');
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'team_answers');
    expect(teamsEq).toHaveBeenCalledWith('rallye_id', 7);
    expect(pointsIn).toHaveBeenCalledWith('team_id', [1]);
  });

  it('skips the points query when there are no teams', async () => {
    useResults({ data: [], error: null }, { data: points, error: null });

    await expect(getScoreboardData(7)).resolves.toEqual({
      teams: [],
      points: [],
    });
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('throws a teams query error', async () => {
    const error = new Error('teams failed');
    useResults({ data: null, error }, { data: points, error: null });
    await expect(getScoreboardData(7)).rejects.toBe(error);
  });

  it('throws a points query error', async () => {
    const error = new Error('points failed');
    useResults({ data: teams, error: null }, { data: null, error });
    await expect(getScoreboardData(7)).rejects.toBe(error);
  });
});
