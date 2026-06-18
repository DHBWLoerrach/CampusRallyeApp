import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import TeamSetup from '../team-setup';
import { store$ } from '@/services/storage/Store';
import { setCurrentTeam } from '@/services/storage/teamStorage';

const mockRouterPush = jest.fn();
const mockSingle = jest.fn(() =>
  Promise.resolve({ data: { id: 5, name: 'Generated Team' }, error: null })
);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock('@legendapp/state/react', () => ({
  observer: (component: unknown) => component,
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
  },
}));

jest.mock('@/services/storage/teamStorage', () => ({
  setCurrentTeam: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/utils/RandomTeamNames', () => ({
  __esModule: true,
  default: jest.fn(() => 'Generated Team'),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ infoBox: {} }),
}));

jest.mock('@/utils/GlobalStyles', () => ({
  globalStyles: {
    default: { container: {} },
    teamStyles: { title: {}, container: {}, infoBox: {}, message: {} },
  },
}));

jest.mock('@/components/ui/Screen', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Screen: ({ children }: { children: React.ReactNode }) => (
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

jest.mock('@/components/ui/UIButton', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      onPress,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
    }) => <Text onPress={onPress}>{children}</Text>,
  };
});

jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: { get: jest.fn(() => ({ id: 1, name: 'Rallye 1' })) },
    team: { set: jest.fn() },
  },
}));

describe('TeamSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to the team name sheet route after creating a team', async () => {
    const { getByText } = render(<TeamSetup />);

    fireEvent.press(getByText('teamSetup.button'));

    await waitFor(() => {
      expect(store$.team.set).toHaveBeenCalledWith({
        id: 5,
        name: 'Generated Team',
      });
      expect(setCurrentTeam).toHaveBeenCalledWith(1, {
        id: 5,
        name: 'Generated Team',
      });
      expect(mockRouterPush).toHaveBeenCalledWith(
        '/(tabs)/rallye/team-name-sheet'
      );
    });
  });
});
