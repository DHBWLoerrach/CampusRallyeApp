import React from 'react';
import { act, render } from '@testing-library/react-native';
import Scoreboard from '../scoreboard';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mocks
jest.mock('@/components/ui/Screen', () => {
  const { View } = jest.requireActual('react-native');
  return {
    ScreenScrollView: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('@/components/themed/ThemedText', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => <Text>{children}</Text>,
  };
});

let mockTeams: any[] = [];
let mockPoints: any[] = [];
let mockTeamsError: any = null;
jest.mock('@/services/storage/scoreboardStorage', () => ({
  getScoreboardData: jest.fn(() =>
    mockTeamsError
      ? Promise.reject(mockTeamsError)
      : Promise.resolve({ teams: mockTeams, points: mockPoints })
  ),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({
    infoBox: {},
    text: {},
    muted: {},
    listRow: {},
  }),
}));

jest.mock('@/utils/GlobalStyles', () => ({
  globalStyles: {
    default: { refreshContainer: {} },
    rallyeStatesStyles: {
      container: {},
      infoBox: {},
      infoTitle: {},
      infoSubtitle: {},
    },
    scoreboardStyles: { row: {}, cell: {}, cellWide: {}, cellHighlighted: {} },
  },
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

// Mock Store
let mockRallye: any = null;
let mockTeam: any = null;
jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: {
      get: () => mockRallye,
    },
    team: {
      get: () => mockTeam,
    },
  },
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => any) => selector(),
}));

describe('Scoreboard', () => {
  beforeEach(() => {
    mockTeams = [];
    mockPoints = [];
    mockTeamsError = null;
    mockRallye = null;
    mockTeam = null;
  });

  it('renders rallye name in header', async () => {
    mockRallye = {
      id: 1,
      name: 'Test Rallye Name',
      status: 'ended',
    };

    const { getByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    expect(getByText('scoreboard.title')).toBeTruthy();
    expect(getByText('Test Rallye Name')).toBeTruthy();
  });

  it('does not render rallye name if not present', () => {
    mockRallye = null;
    const { queryByText } = render(<Scoreboard />);
    expect(queryByText('Test Rallye Name')).toBeNull();
  });

  it('displays medal emojis for top 3 teams', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ended' };
    mockTeams = [
      {
        id: 1,
        name: 'Alpha',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
      {
        id: 2,
        name: 'Beta',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:30:00Z',
      },
      {
        id: 3,
        name: 'Gamma',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T12:00:00Z',
      },
    ];
    mockPoints = [
      { team_id: 1, team_points: 30 },
      { team_id: 2, team_points: 20 },
      { team_id: 3, team_points: 10 },
    ];

    const { getByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    expect(getByText('🥇')).toBeTruthy();
    expect(getByText('🥈')).toBeTruthy();
    expect(getByText('🥉')).toBeTruthy();
  });

  it('ranks tied teams equally without skipping the next rank (dense ranking)', async () => {
    mockRallye = { id: 1, name: 'R', status: 'results' };
    mockTeams = [
      {
        id: 1,
        name: 'A',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T12:00:00Z',
      },
      {
        id: 2,
        name: 'B',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T10:30:00Z',
      },
      {
        id: 3,
        name: 'C',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
    ];
    // A and B tie on points despite different play time; C has fewer points
    // and must land on rank 2, not 3 (dense ranking, no skipped rank).
    mockPoints = [
      { team_id: 1, team_points: 10 },
      { team_id: 2, team_points: 10 },
      { team_id: 3, team_points: 5 },
    ];

    const { getAllByText, getByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    expect(getAllByText('🥇').length).toBe(2);
    expect(getByText('🥈')).toBeTruthy();
  });

  it('highlights own team row', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ended' };
    mockTeam = { id: 2, name: 'MyTeam' };
    mockTeams = [
      {
        id: 1,
        name: 'Other',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
      {
        id: 2,
        name: 'MyTeam',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
    ];
    mockPoints = [
      { team_id: 1, team_points: 20 },
      { team_id: 2, team_points: 10 },
    ];

    const { getAllByText, getByText, queryByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    expect(queryByText(/scoreboard\.yourTeamLabel/)).toBeNull();
    expect(getByText('rallye.currentTeamLabel')).toBeTruthy();
    expect(getAllByText('MyTeam').length).toBe(2);
  });

  it('shows the own team play time as a retrospective, not for other teams', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ended' };
    mockTeam = { id: 2, name: 'MyTeam' };
    mockTeams = [
      {
        id: 1,
        name: 'Other',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
      {
        id: 2,
        name: 'MyTeam',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T10:47:00Z',
      },
    ];
    mockPoints = [
      { team_id: 1, team_points: 20 },
      { team_id: 2, team_points: 10 },
    ];

    const { getAllByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    // Only the own team's row renders the retrospective duration text.
    expect(getAllByText('scoreboard.ownDuration').length).toBe(1);
  });

  it('renders team points in the row', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ended' };
    mockTeams = [
      {
        id: 1,
        name: 'Solo',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
    ];
    mockPoints = [{ team_id: 1, team_points: 42 }];

    const { getByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    expect(getByText('Solo')).toBeTruthy();
    // Points 42 rendered in team row
    expect(getByText(/42/)).toBeTruthy();
  });

  it('shows an error message when the teams query fails', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ended' };
    mockTeams = [
      {
        id: 1,
        name: 'Hidden Team',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
    ];
    mockTeamsError = { message: 'denied' };
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const { getByText, queryByText } = render(<Scoreboard />);
      await act(async () => {
        await flushPromises();
      });

      expect(getByText('scoreboard.error.load')).toBeTruthy();
      expect(queryByText('Hidden Team')).toBeNull();
      expect(consoleError).toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('sums multiple answers per team into one total', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ended' };
    mockTeams = [
      {
        id: 1,
        name: 'Sum Team',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
    ];
    mockPoints = [
      { team_id: 1, team_points: 10 },
      { team_id: 1, team_points: 5 },
    ];

    const { getByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    expect(getByText(/15/)).toBeTruthy();
  });

  it('shows zero points for a team with no answers', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ended' };
    mockTeams = [
      {
        id: 1,
        name: 'Zero Team',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
    ];

    const { getByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    expect(getByText(/^0$/)).toBeTruthy();
  });
});
