import React, { type ReactNode } from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import Welcome from '../index';
import {
  setCurrentRallye,
  getLocationsWithActiveRallyes,
  getLocationDashboardData,
  getSelectedLocation,
} from '@/services/storage/rallyeStorage';
import {
  clearCurrentTeam,
  getCurrentTeam,
  teamExists,
} from '@/services/storage/teamStorage';
import {
  getRallyePasswordSheetSession,
  setRallyePasswordSheetSession,
} from '@/services/rallyePasswordSheetSession';
import { store$ } from '@/services/storage/Store';
import type { Rallye } from '@/types/rallye';

const mockRouterPush = jest.fn();
const mockAppStateSubscriptionRemove = jest.fn();
let mockPasswordSheetSession: unknown = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

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

jest.mock('@/components/ui/RallyePasswordSheet', () => ({
  __esModule: true,
  isPasswordRequired: (
    rallye: { password?: string | null } | null | undefined
  ) => !!(rallye?.password ?? '').trim().length,
}));

jest.mock('@/services/rallyePasswordSheetSession', () => ({
  clearRallyePasswordSheetSession: jest.fn(() => {
    mockPasswordSheetSession = null;
  }),
  getRallyePasswordSheetSession: jest.fn(() => mockPasswordSheetSession),
  setRallyePasswordSheetSession: jest.fn((session: unknown) => {
    mockPasswordSheetSession = session;
  }),
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
    default: ({
      children,
      onPress,
    }: {
      children: ReactNode;
      onPress?: () => void;
    }) => <Text onPress={onPress}>{children}</Text>,
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
    enabled: { get: jest.fn(() => false), set: jest.fn() },
    reset: jest.fn(),
    leaveRallye: jest.fn(),
  },
}));

jest.mock('@/services/storage/rallyeStorage', () => ({
  __esModule: true,
  getLocationsWithActiveRallyes: jest.fn(),
  getLocationDashboardData: jest.fn(),
  getSelectedLocation: jest.fn(),
  setSelectedLocation: jest.fn(),
  clearSelectedLocation: jest.fn(),
  setCurrentRallye: jest.fn(),
}));

jest.mock('@/services/storage/teamStorage', () => ({
  __esModule: true,
  getCurrentTeam: jest.fn(),
  teamExists: jest.fn(),
  clearCurrentTeam: jest.fn(),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ muted: {}, text: {} }),
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

const mockedGetLocationsWithActiveRallyes =
  getLocationsWithActiveRallyes as jest.MockedFunction<
    typeof getLocationsWithActiveRallyes
  >;
const mockedGetLocationDashboardData =
  getLocationDashboardData as jest.MockedFunction<
    typeof getLocationDashboardData
  >;
const mockedGetSelectedLocation = getSelectedLocation as jest.MockedFunction<
  typeof getSelectedLocation
>;
const mockedSetCurrentRallye = setCurrentRallye as jest.MockedFunction<
  typeof setCurrentRallye
>;
const mockedGetCurrentTeam = getCurrentTeam as jest.MockedFunction<
  typeof getCurrentTeam
>;
const mockedTeamExists = teamExists as jest.MockedFunction<typeof teamExists>;
const mockedClearCurrentTeam = clearCurrentTeam as jest.MockedFunction<
  typeof clearCurrentTeam
>;
const mockedSetRallyePasswordSheetSession =
  setRallyePasswordSheetSession as jest.MockedFunction<
    typeof setRallyePasswordSheetSession
  >;
const mockedGetRallyePasswordSheetSession =
  getRallyePasswordSheetSession as jest.MockedFunction<
    typeof getRallyePasswordSheetSession
  >;

describe('Welcome', () => {
  const mockLocation = {
    id: 1,
    name: 'Test Org',
    default_rallye_id: null,
    created_at: '2024-01-01T00:00:00Z',
  };
  const mockDepartment = {
    id: 1,
    name: 'Test Dept',
    location_id: 1,
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockPasswordSheetSession = null;
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });
    jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
      remove: mockAppStateSubscriptionRemove,
    }));

    mockedGetSelectedLocation.mockResolvedValue(null);
    mockedGetLocationsWithActiveRallyes.mockResolvedValue([mockLocation]);
    mockedGetLocationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      departmentEntries: [],
    });
    mockedGetCurrentTeam.mockResolvedValue(null);
    mockedTeamExists.mockResolvedValue('missing');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows tour mode when dashboard has only tour mode rallye', async () => {
    const tourModeRallye: Rallye = {
      id: 1,
      name: 'Campus Tour',
      department_id: 1,
      status: 'running',
      password: '',
      mode: 'tour',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedLocation.mockResolvedValue(mockLocation);
    mockedGetLocationDashboardData.mockResolvedValue({
      tourModeRallye,
      departmentEntries: [],
    });

    const { getByText, queryByText } = render(<Welcome />);

    await waitFor(() => {
      expect(getByText('welcome.explore.title')).toBeTruthy();
    });

    expect(queryByText('welcome.explore.description')).toBeNull();
    expect(queryByText('welcome.noContent')).toBeNull();
    expect(queryByText('welcome.selectDepartment.description')).toBeNull();
  });

  it('renders single department rallye as direct join action and joins directly', async () => {
    const departmentRallye: Rallye = {
      id: 11,
      name: 'Informatik Rallye',
      department_id: mockDepartment.id,
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedLocation.mockResolvedValue(mockLocation);
    mockedGetLocationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      departmentEntries: [{ department: mockDepartment, rallyes: [departmentRallye] }],
    });
    mockedSetCurrentRallye.mockResolvedValue();

    const { getByText } = render(<Welcome />);

    await waitFor(() => {
      expect(getByText(departmentRallye.name)).toBeTruthy();
      expect(getByText('rallye.join')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('rallye.join'));
    });

    expect(mockedSetCurrentRallye).toHaveBeenCalledWith(departmentRallye);
    expect(store$.enabled.set).toHaveBeenCalledWith(true);
  });

  it('renders all locations directly when more than three are available', async () => {
    const secondLocation = {
      id: 2,
      name: 'Second Org',
      default_rallye_id: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const thirdLocation = {
      id: 3,
      name: 'Third Org',
      default_rallye_id: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const fourthLocation = {
      id: 4,
      name: 'Fourth Org',
      default_rallye_id: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetLocationsWithActiveRallyes.mockResolvedValue([
      mockLocation,
      secondLocation,
      thirdLocation,
      fourthLocation,
    ]);

    const { getByText, queryByText } = render(<Welcome />);

    await waitFor(() => {
      expect(getByText('welcome.selectLocation.description')).toBeTruthy();
    });

    expect(getByText('Test Org')).toBeTruthy();
    expect(getByText('Second Org')).toBeTruthy();
    expect(getByText('Third Org')).toBeTruthy();
    expect(getByText('Fourth Org')).toBeTruthy();
    expect(queryByText('welcome.selectLocation.button')).toBeNull();
    expect(queryByText('welcome.selectLocation.title')).toBeNull();
  });

  it('keeps local team when team existence is unknown during direct join', async () => {
    const rallye: Rallye = {
      id: 5,
      name: 'Department Rallye',
      department_id: mockDepartment.id,
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const existingTeam = { id: 7, name: 'Team' };

    mockedGetSelectedLocation.mockResolvedValue(mockLocation);
    mockedGetLocationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      departmentEntries: [{ department: mockDepartment, rallyes: [rallye] }],
    });
    mockedSetCurrentRallye.mockResolvedValue();
    mockedGetCurrentTeam.mockResolvedValue(existingTeam);
    mockedTeamExists.mockResolvedValue('unknown');

    const { getByText, queryByText } = render(<Welcome />);
    await waitFor(() => {
      expect(getByText('rallye.join')).toBeTruthy();
    });
    expect(getByText('Department Rallye')).toBeTruthy();
    expect(getByText('Test Dept')).toBeTruthy();
    expect(queryByText('welcome.selectDepartment.description')).toBeNull();

    await act(async () => {
      fireEvent.press(getByText('rallye.join'));
    });

    expect(mockedClearCurrentTeam).not.toHaveBeenCalled();
    expect(store$.team.set).toHaveBeenLastCalledWith(existingTeam);
  });

  it('opens password sheet route for department rallye with password', async () => {
    const passwordRallye: Rallye = {
      id: 6,
      name: 'Protected Rallye',
      department_id: mockDepartment.id,
      status: 'running',
      password: 'secret',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedLocation.mockResolvedValue(mockLocation);
    mockedGetLocationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      departmentEntries: [
        { department: mockDepartment, rallyes: [passwordRallye] },
      ],
    });

    const { getByText } = render(<Welcome />);
    await waitFor(() => {
      expect(getByText('rallye.join')).toBeTruthy();
    });
    expect(getByText('Protected Rallye')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('rallye.join'));
    });

    expect(mockedSetRallyePasswordSheetSession).toHaveBeenCalledWith(
      expect.objectContaining({
        rallye: passwordRallye,
        onJoin: expect.any(Function),
      })
    );
    expect(mockRouterPush).toHaveBeenCalledWith('/rallye-password-sheet');
    expect(mockedGetRallyePasswordSheetSession).toHaveBeenCalled();
    expect(mockedSetCurrentRallye).not.toHaveBeenCalled();
  });

  it('does not stack password sheets on repeated protected rallye taps', async () => {
    const passwordRallye: Rallye = {
      id: 6,
      name: 'Protected Rallye',
      department_id: mockDepartment.id,
      status: 'running',
      password: 'secret',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedLocation.mockResolvedValue(mockLocation);
    mockedGetLocationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      departmentEntries: [
        { department: mockDepartment, rallyes: [passwordRallye] },
      ],
    });

    const { getByText } = render(<Welcome />);
    await waitFor(() => {
      expect(getByText('rallye.join')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('rallye.join'));
      fireEvent.press(getByText('rallye.join'));
    });

    expect(mockedSetRallyePasswordSheetSession).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
  });

  it('expands department card when multiple rallyes are available', async () => {
    const rallyeA: Rallye = {
      id: 7,
      name: 'Rallye A',
      department_id: mockDepartment.id,
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const rallyeB: Rallye = {
      id: 8,
      name: 'Rallye B',
      department_id: mockDepartment.id,
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedLocation.mockResolvedValue(mockLocation);
    mockedGetLocationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      departmentEntries: [
        { department: mockDepartment, rallyes: [rallyeA, rallyeB] },
      ],
    });

    const { getAllByText, queryByText, getByText } = render(<Welcome />);
    await waitFor(() => {
      expect(getAllByText('welcome.join.select').length).toBeGreaterThan(0);
    });

    expect(queryByText('welcome.join.count')).toBeNull();
    expect(queryByText('Rallye A')).toBeNull();
    expect(queryByText('Rallye B')).toBeNull();

    await act(async () => {
      const selectableItems = getAllByText('welcome.join.select');
      fireEvent.press(selectableItems[selectableItems.length - 1]);
    });

    expect(getByText('Rallye A')).toBeTruthy();
    expect(getByText('Rallye B')).toBeTruthy();
  });

  it('does not show department section label when multiple departments are available', async () => {
    const rallyeA: Rallye = {
      id: 9,
      name: 'Rallye A',
      department_id: mockDepartment.id,
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const secondDepartment = {
      id: 2,
      name: 'Second Dept',
      location_id: 1,
      created_at: '2024-01-01T00:00:00Z',
    };
    const rallyeB: Rallye = {
      id: 10,
      name: 'Rallye B',
      department_id: secondDepartment.id,
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedLocation.mockResolvedValue(mockLocation);
    mockedGetLocationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      departmentEntries: [
        { department: mockDepartment, rallyes: [rallyeA] },
        { department: secondDepartment, rallyes: [rallyeB] },
      ],
    });

    const { getByText, queryByText } = render(<Welcome />);
    await waitFor(() => {
      expect(getByText(mockDepartment.name)).toBeTruthy();
      expect(getByText(secondDepartment.name)).toBeTruthy();
    });
    expect(queryByText('welcome.selectDepartment.description')).toBeNull();
  });

  it('performs one delayed sync without falling into a 2-second refresh loop', async () => {
    jest.useFakeTimers();

    mockedGetSelectedLocation.mockResolvedValue(mockLocation);

    render(<Welcome />);

    await waitFor(() => {
      expect(mockedGetLocationsWithActiveRallyes).toHaveBeenCalledTimes(1);
      expect(mockedGetLocationDashboardData).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });

    await waitFor(() => {
      expect(mockedGetLocationsWithActiveRallyes).toHaveBeenCalledTimes(2);
      expect(mockedGetLocationDashboardData).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });

    expect(mockedGetLocationsWithActiveRallyes).toHaveBeenCalledTimes(2);
    expect(mockedGetLocationDashboardData).toHaveBeenCalledTimes(2);
  });

  it('shows newly added rallyes after the delayed sync without manual refresh', async () => {
    jest.useFakeTimers();

    const newRallye: Rallye = {
      id: 99,
      name: 'New Rallye',
      department_id: mockDepartment.id,
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedLocation.mockResolvedValue(mockLocation);
    mockedGetLocationDashboardData
      .mockResolvedValueOnce({
        tourModeRallye: null,
        departmentEntries: [],
      })
      .mockResolvedValueOnce({
        tourModeRallye: null,
        departmentEntries: [
          { department: mockDepartment, rallyes: [newRallye] },
        ],
      });

    const { queryByText, getByText } = render(<Welcome />);

    await waitFor(() => {
      expect(mockedGetLocationDashboardData).toHaveBeenCalledTimes(1);
    });

    expect(queryByText(newRallye.name)).toBeNull();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });

    await waitFor(() => {
      expect(getByText(newRallye.name)).toBeTruthy();
    });
  });

  it('keeps the currently selected location when more locations become available', async () => {
    jest.useFakeTimers();

    const secondLocation = {
      id: 2,
      name: 'Second Org',
      default_rallye_id: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const initialRallye: Rallye = {
      id: 201,
      name: 'Initial Rallye',
      department_id: mockDepartment.id,
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const refreshedRallye: Rallye = {
      id: 202,
      name: 'Refreshed Rallye',
      department_id: mockDepartment.id,
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedLocation.mockResolvedValue(mockLocation);
    mockedGetLocationsWithActiveRallyes
      .mockResolvedValueOnce([mockLocation])
      .mockResolvedValueOnce([mockLocation, secondLocation]);
    mockedGetLocationDashboardData
      .mockResolvedValueOnce({
        tourModeRallye: null,
        departmentEntries: [
          { department: mockDepartment, rallyes: [initialRallye] },
        ],
      })
      .mockResolvedValueOnce({
        tourModeRallye: null,
        departmentEntries: [
          { department: mockDepartment, rallyes: [refreshedRallye] },
        ],
      });

    const { getByText } = render(<Welcome />);

    await waitFor(() => {
      expect(getByText(initialRallye.name)).toBeTruthy();
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });

    await waitFor(() => {
      expect(getByText(refreshedRallye.name)).toBeTruthy();
    });

    expect(mockedGetLocationDashboardData).toHaveBeenNthCalledWith(
      1,
      mockLocation.id
    );
  });
});
