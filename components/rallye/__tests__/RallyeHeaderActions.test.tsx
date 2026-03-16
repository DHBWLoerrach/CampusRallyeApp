import React from 'react';
import { render } from '@testing-library/react-native';
import RallyeHeaderActions from '../RallyeHeaderActions';

let mockRallye: { status: string; end_time: string | null } | null = null;
let mockIsTourMode = false;

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: { get: () => mockRallye },
    isTourMode: { get: () => mockIsTourMode },
    timeExpired: { set: jest.fn() },
    leaveRallye: jest.fn(),
  },
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/utils/ConfirmAlert', () => ({
  confirm: jest.fn(async () => true),
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => null,
}));

describe('RallyeHeaderActions', () => {
  beforeEach(() => {
    mockRallye = {
      status: 'running',
      end_time: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
    mockIsTourMode = false;
  });

  it('renders timer and logout while the rallye is running', () => {
    const { getByText, getByLabelText } = render(<RallyeHeaderActions />);

    expect(getByText(/\d{2}:\d{2}:\d{2}/)).toBeTruthy();
    expect(getByLabelText('a11y.logoutButton')).toBeTruthy();
  });

  it('keeps only the logout button in tour mode', () => {
    mockIsTourMode = true;

    const { queryByText, getByLabelText } = render(<RallyeHeaderActions />);

    expect(queryByText(/\d{2}:\d{2}:\d{2}/)).toBeNull();
    expect(getByLabelText('a11y.logoutButton')).toBeTruthy();
  });
});
