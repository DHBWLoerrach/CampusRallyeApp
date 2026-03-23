/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockCreateTeamAuto = jest.fn();
const mockCreateTeamManual = jest.fn();

jest.mock('@legendapp/state/react', () => ({
  observer: (component: any) => component,
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    reset: jest.fn(),
    team: { set: jest.fn() },
    showTeamNameSheet: { set: jest.fn() },
    rallye: { get: jest.fn(() => ({ id: 42, name: 'Campus Rallye' })) },
  },
}));

jest.mock('@/services/storage/teamStorage', () => ({
  createTeamAuto: (...args: unknown[]) => mockCreateTeamAuto(...args),
  createTeamManual: (...args: unknown[]) => mockCreateTeamManual(...args),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({
    infoBox: {},
  }),
}));

jest.mock('@/utils/GlobalStyles', () => ({
  globalStyles: {
    default: { container: {} },
    teamStyles: {
      title: {},
      container: {},
      infoBox: {},
      message: {},
    },
  },
}));

jest.mock('@/components/ui/Screen', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Screen: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('@/components/themed/ThemedText', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
  };
});

jest.mock('@/components/themed/ThemedTextInput', () => {
  const { TextInput } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: (props: any) => <TextInput {...props} testID="manual-team-name-input" />,
  };
});

jest.mock('@/components/ui/UIButton', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
      <Text onPress={onPress}>{children}</Text>
    ),
  };
});

import TeamSetup from '../team-setup';

describe('TeamSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both creation options', () => {
    const { getByText } = render(<TeamSetup />);

    expect(getByText('teamSetup.auto.button')).toBeTruthy();
    expect(getByText('teamSetup.manual.button')).toBeTruthy();
  });

  it('calls createTeamAuto on auto button press', async () => {
    mockCreateTeamAuto.mockResolvedValue({ id: 1, name: 'Team Alpha', rallye_id: 42 });

    const { getByText } = render(<TeamSetup />);

    fireEvent.press(getByText('teamSetup.auto.button'));

    await waitFor(() => {
      expect(mockCreateTeamAuto).toHaveBeenCalledWith(42, 5);
    });
  });

  it('blocks manual submit for invalid names and shows validation error', async () => {
    const { getByText, getByTestId } = render(<TeamSetup />);

    fireEvent.press(getByText('teamSetup.manual.button'));
    fireEvent.changeText(getByTestId('manual-team-name-input'), 'abc');
    fireEvent.press(getByText('teamSetup.manual.submit'));

    await waitFor(() => {
      expect(mockCreateTeamManual).not.toHaveBeenCalled();
    });

    expect(getByText('teamSetup.manual.error.invalid')).toBeTruthy();
  });
});
