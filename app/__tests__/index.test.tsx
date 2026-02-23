import React, { type ReactNode } from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import Welcome from '../index';
import {
  setCurrentRallye,
  getOrganizationsWithActiveRallyes,
  getOrganizationDashboardData,
  getSelectedOrganization,
} from '@/services/storage/rallyeStorage';
import {
  clearCurrentTeam,
  getCurrentTeam,
  teamExists,
} from '@/services/storage/teamStorage';
import { store$ } from '@/services/storage/Store';
import type { Rallye } from '@/types/rallye';

let mockPasswordSheetProps: any;

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
  isPasswordRequired: (rallye: { password?: string | null } | null | undefined) =>
    !!(rallye?.password ?? '').trim().length,
  default: (props: any) => {
    mockPasswordSheetProps = props;
    return null;
  },
}));

jest.mock('@/components/ui/SelectionModal', () => ({
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
  getOrganizationsWithActiveRallyes: jest.fn(),
  getOrganizationDashboardData: jest.fn(),
  getSelectedOrganization: jest.fn(),
  setSelectedOrganization: jest.fn(),
  clearSelectedOrganization: jest.fn(),
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

const mockedGetOrganizationsWithActiveRallyes =
  getOrganizationsWithActiveRallyes as jest.MockedFunction<
    typeof getOrganizationsWithActiveRallyes
  >;
const mockedGetOrganizationDashboardData =
  getOrganizationDashboardData as jest.MockedFunction<
    typeof getOrganizationDashboardData
  >;
const mockedGetSelectedOrganization =
  getSelectedOrganization as jest.MockedFunction<typeof getSelectedOrganization>;
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

describe('Welcome', () => {
  const mockOrganization = {
    id: 1,
    name: 'Test Org',
    default_rallye_id: null,
    created_at: '2024-01-01T00:00:00Z',
  };
  const mockDepartment = {
    id: 1,
    name: 'Test Dept',
    organization_id: 1,
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPasswordSheetProps = null;

    mockedGetSelectedOrganization.mockResolvedValue(null);
    mockedGetOrganizationsWithActiveRallyes.mockResolvedValue([mockOrganization]);
    mockedGetOrganizationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      campusEventsRallyes: [],
      departmentEntries: [],
    });
    mockedGetCurrentTeam.mockResolvedValue(null);
    mockedTeamExists.mockResolvedValue('missing');
  });

  it('shows tour mode when dashboard has only tour mode rallye', async () => {
    const tourModeRallye: Rallye = {
      id: 1,
      name: 'Campus Tour',
      status: 'running',
      password: '',
      mode: 'tour',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedOrganization.mockResolvedValue(mockOrganization);
    mockedGetOrganizationDashboardData.mockResolvedValue({
      tourModeRallye,
      campusEventsRallyes: [],
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

  it('renders campus events as direct rallye actions and joins directly', async () => {
    const campusRallye: Rallye = {
      id: 11,
      name: 'Campus Event Rallye',
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedOrganization.mockResolvedValue(mockOrganization);
    mockedGetOrganizationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      campusEventsRallyes: [campusRallye],
      departmentEntries: [],
    });
    mockedSetCurrentRallye.mockResolvedValue();

    const { getByText, queryByText } = render(<Welcome />);

    await waitFor(() => {
      expect(getByText('welcome.campusEvents.title')).toBeTruthy();
      expect(getByText(campusRallye.name)).toBeTruthy();
    });
    expect(queryByText('welcome.campusEvents.description')).toBeNull();

    await act(async () => {
      fireEvent.press(getByText(campusRallye.name));
    });

    expect(mockedSetCurrentRallye).toHaveBeenCalledWith(campusRallye);
    expect(store$.enabled.set).toHaveBeenCalledWith(true);
  });

  it('keeps local team when team existence is unknown during direct join', async () => {
    const rallye: Rallye = {
      id: 5,
      name: 'Department Rallye',
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const existingTeam = { id: 7, name: 'Team' };

    mockedGetSelectedOrganization.mockResolvedValue(mockOrganization);
    mockedGetOrganizationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      campusEventsRallyes: [],
      departmentEntries: [{ department: mockDepartment, rallyes: [rallye] }],
    });
    mockedSetCurrentRallye.mockResolvedValue();
    mockedGetCurrentTeam.mockResolvedValue(existingTeam);
    mockedTeamExists.mockResolvedValue('unknown');

    const { getByText, queryByText } = render(<Welcome />);
    await waitFor(() => {
      expect(getByText('rallye.join')).toBeTruthy();
    });
    expect(queryByText('Department Rallye')).toBeNull();
    expect(queryByText('welcome.selectDepartment.description')).toBeNull();

    await act(async () => {
      fireEvent.press(getByText('rallye.join'));
    });

    expect(mockedClearCurrentTeam).not.toHaveBeenCalled();
    expect(store$.team.set).toHaveBeenLastCalledWith(existingTeam);
  });

  it('opens password sheet for department rallye with password', async () => {
    const passwordRallye: Rallye = {
      id: 6,
      name: 'Protected Rallye',
      status: 'running',
      password: 'secret',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedOrganization.mockResolvedValue(mockOrganization);
    mockedGetOrganizationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      campusEventsRallyes: [],
      departmentEntries: [{ department: mockDepartment, rallyes: [passwordRallye] }],
    });

    const { getByText } = render(<Welcome />);
    await waitFor(() => {
      expect(getByText('rallye.join')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('rallye.join'));
    });

    expect(mockPasswordSheetProps.visible).toBe(true);
    expect(mockPasswordSheetProps.rallye).toEqual(passwordRallye);
    expect(mockedSetCurrentRallye).not.toHaveBeenCalled();
  });

  it('expands department card when multiple rallyes are available', async () => {
    const rallyeA: Rallye = {
      id: 7,
      name: 'Rallye A',
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const rallyeB: Rallye = {
      id: 8,
      name: 'Rallye B',
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedOrganization.mockResolvedValue(mockOrganization);
    mockedGetOrganizationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      campusEventsRallyes: [],
      departmentEntries: [{ department: mockDepartment, rallyes: [rallyeA, rallyeB] }],
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

  it('shows department section label when multiple departments are available', async () => {
    const rallyeA: Rallye = {
      id: 9,
      name: 'Rallye A',
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const secondDepartment = {
      id: 2,
      name: 'Second Dept',
      organization_id: 1,
      created_at: '2024-01-01T00:00:00Z',
    };
    const rallyeB: Rallye = {
      id: 10,
      name: 'Rallye B',
      status: 'running',
      password: '',
      mode: 'department',
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockedGetSelectedOrganization.mockResolvedValue(mockOrganization);
    mockedGetOrganizationDashboardData.mockResolvedValue({
      tourModeRallye: null,
      campusEventsRallyes: [],
      departmentEntries: [
        { department: mockDepartment, rallyes: [rallyeA] },
        { department: secondDepartment, rallyes: [rallyeB] },
      ],
    });

    const { getByText } = render(<Welcome />);
    await waitFor(() => {
      expect(getByText('welcome.selectDepartment.description')).toBeTruthy();
    });
  });
});
