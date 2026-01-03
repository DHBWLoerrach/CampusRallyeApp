import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Welcome from '../index';
import {
  getActiveRallyes,
  getTourModeRallye,
} from '@/services/storage/rallyeStorage';

jest.mock('@/components/ui/CollapsibleHeroHeader', () => {
  const { View } = jest.requireActual('react-native');
  const CollapsibleHeroHeader = ({ children }: { children: any }) => (
    <View>{children}</View>
  );
  return {
    __esModule: true,
    default: CollapsibleHeroHeader,
    CollapsibleHeroHeader,
  };
});

jest.mock('@/components/ui/RallyeSelectionModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/ui/Card', () => {
  const { Text, View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      title,
      description,
      children,
    }: {
      title: string;
      description: string;
      children?: ReactNode;
    }) => (
      <View>
        <Text>{title}</Text>
        <Text>{description}</Text>
        {children}
      </View>
    ),
  };
});

jest.mock('@/components/ui/UIButton', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  };
});

jest.mock('@/components/themed/ThemedText', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  };
});

jest.mock('@/services/storage/Store', () => ({
  store$: {
    resumeAvailable: { get: jest.fn(() => false), set: jest.fn() },
    rallye: { get: jest.fn(() => null), set: jest.fn() },
    team: { get: jest.fn(() => null), set: jest.fn() },
    enabled: { set: jest.fn() },
    reset: jest.fn(),
    leaveRallye: jest.fn(),
  },
}));

jest.mock('@/services/storage/rallyeStorage', () => ({
  __esModule: true,
  getActiveRallyes: jest.fn(),
  getTourModeRallye: jest.fn(),
  setCurrentRallye: jest.fn(),
}));

jest.mock('@/services/storage/teamStorage', () => ({
  __esModule: true,
  getCurrentTeam: jest.fn(),
  teamExists: jest.fn(),
  clearCurrentTeam: jest.fn(),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ muted: {} }),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false, mode: 'light', setMode: jest.fn() }),
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

const mockedGetActiveRallyes = getActiveRallyes as jest.MockedFunction<
  typeof getActiveRallyes
>;
const mockedGetTourModeRallye = getTourModeRallye as jest.MockedFunction<
  typeof getTourModeRallye
>;

describe('Welcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows tour mode when no rallyes are available but tour mode exists', async () => {
    mockedGetActiveRallyes.mockResolvedValue({ data: [], error: null });
    mockedGetTourModeRallye.mockResolvedValue({
      id: 1,
      name: 'Campus Tour',
      status: 'running',
      tour_mode: true,
    });

    const { getByText, queryByText } = render(<Welcome />);

    await waitFor(() => {
      expect(getByText('welcome.explore.title')).toBeTruthy();
    });

    expect(getByText('welcome.noRallyes.title')).toBeTruthy();
    expect(queryByText('welcome.empty')).toBeNull();
    expect(queryByText('welcome.join.title')).toBeNull();
  });
});
