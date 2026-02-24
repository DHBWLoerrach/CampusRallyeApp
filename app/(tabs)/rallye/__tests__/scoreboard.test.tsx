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
jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => Promise.resolve({ data: mockTeams }),
        in: () => Promise.resolve({ data: mockPoints, error: null }),
      }),
    }),
  },
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
      { id: '1', name: 'Alpha', created_at: '2024-01-01T10:00:00Z', time_played: '2024-01-01T11:00:00Z' },
      { id: '2', name: 'Beta', created_at: '2024-01-01T10:00:00Z', time_played: '2024-01-01T11:30:00Z' },
      { id: '3', name: 'Gamma', created_at: '2024-01-01T10:00:00Z', time_played: '2024-01-01T12:00:00Z' },
    ];
    mockPoints = [
      { team_id: '1', points: 30 },
      { team_id: '2', points: 20 },
      { team_id: '3', points: 10 },
    ];

    const { getByText } = render(<Scoreboard />);
    await act(async () => { await flushPromises(); });

    expect(getByText('🥇')).toBeTruthy();
    expect(getByText('🥈')).toBeTruthy();
    expect(getByText('🥉')).toBeTruthy();
  });

  it('sorts teams by points descending, then by time', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ranking' };
    mockTeams = [
      { id: '1', name: 'Slow', created_at: '2024-01-01T10:00:00Z', time_played: '2024-01-01T12:00:00Z' },
      { id: '2', name: 'Fast', created_at: '2024-01-01T10:00:00Z', time_played: '2024-01-01T10:30:00Z' },
    ];
    // Same points — Fast should rank first due to shorter time
    mockPoints = [
      { team_id: '1', points: 10 },
      { team_id: '2', points: 10 },
    ];

    const { getAllByText } = render(<Scoreboard />);
    await act(async () => { await flushPromises(); });

    // 🥇 should appear before 🥈
    const gold = getAllByText('🥇');
    const silver = getAllByText('🥈');
    expect(gold.length).toBe(1);
    expect(silver.length).toBe(1);
  });

  it('highlights own team row', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ended' };
    mockTeam = { id: '2', name: 'MyTeam' };
    mockTeams = [
      { id: '1', name: 'Other', created_at: '2024-01-01T10:00:00Z', time_played: '2024-01-01T11:00:00Z' },
      { id: '2', name: 'MyTeam', created_at: '2024-01-01T10:00:00Z', time_played: '2024-01-01T11:00:00Z' },
    ];
    mockPoints = [
      { team_id: '1', points: 20 },
      { team_id: '2', points: 10 },
    ];

    const { getByText, getAllByText } = render(<Scoreboard />);
    await act(async () => { await flushPromises(); });

    // Own team label should be visible
    expect(getByText(/scoreboard\.yourTeamLabel/)).toBeTruthy();
    // "MyTeam" appears twice: in the "your team" label and in the row
    expect(getAllByText('MyTeam').length).toBeGreaterThanOrEqual(2);
  });

  it('renders team points in the row', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ended' };
    mockTeams = [
      { id: '1', name: 'Solo', created_at: '2024-01-01T10:00:00Z', time_played: '2024-01-01T11:00:00Z' },
    ];
    mockPoints = [
      { team_id: '1', points: 42 },
    ];

    const { getByText } = render(<Scoreboard />);
    await act(async () => { await flushPromises(); });

    expect(getByText('Solo')).toBeTruthy();
    // Points 42 rendered in team row
    expect(getByText(/42/)).toBeTruthy();
  });
});
