import React from 'react';
import { act, render } from '@testing-library/react-native';
import TeamNameSheetScreen from '../team-name-sheet';

const mockRouterBack = jest.fn();
const mockRouterCanGoBack = jest.fn(() => true);
let mockTeam: { name: string } | null = { name: 'Noble Purple Dragons' };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
    canGoBack: mockRouterCanGoBack,
  }),
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: {
      get: jest.fn(() => mockTeam),
    },
  },
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe('TeamNameSheetScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockRouterCanGoBack.mockReturnValue(true);
    mockTeam = { name: 'Noble Purple Dragons' };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the current team name', () => {
    const { getByText } = render(<TeamNameSheetScreen />);

    expect(getByText('team.sheetTitle')).toBeTruthy();
    expect(getByText('Noble Purple Dragons')).toBeTruthy();
  });

  it('dismisses itself after the display duration', () => {
    render(<TeamNameSheetScreen />);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it('dismisses itself when no team name is available', () => {
    mockTeam = null;

    render(<TeamNameSheetScreen />);

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });
});
