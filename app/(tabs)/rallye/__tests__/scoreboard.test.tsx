import React from 'react';
import { render } from '@testing-library/react-native';
import Scoreboard from '../scoreboard';

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

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [] }),
        in: () => Promise.resolve({ data: [] }),
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
jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: {
      get: () => mockRallye,
    },
    team: {
      get: () => null,
    },
  },
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => any) => selector(),
}));

describe('Scoreboard', () => {
  it('renders rallye name in header', () => {
    mockRallye = {
      id: 1,
      name: 'Test Rallye Name',
      status: 'ended',
    };

    const { getByText } = render(<Scoreboard />);

    expect(getByText('scoreboard.title')).toBeTruthy();
    expect(getByText('Test Rallye Name')).toBeTruthy();
  });

  it('does not render rallye name if not present', () => {
    mockRallye = null;
    const { queryByText } = render(<Scoreboard />);
    expect(queryByText('Test Rallye Name')).toBeNull();
  });
});
