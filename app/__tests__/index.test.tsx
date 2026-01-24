import React, { type ReactNode } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import Welcome from '../index';
import {
  setCurrentRallye,
  getOrganizationsWithActiveRallyes,
  getDepartmentsForOrganization,
  getRallyesForDepartment,
  getTourModeRallyeForOrganization,
  getCampusEventsDepartment,
  getSelectedOrganization,
  getSelectedDepartment,
} from '@/services/storage/rallyeStorage';
import {
  clearCurrentTeam,
  getCurrentTeam,
  teamExists,
} from '@/services/storage/teamStorage';
import { store$ } from '@/services/storage/Store';

let mockRallyeModalProps: any;

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
  default: (props: any) => {
    mockRallyeModalProps = props;
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
  getOrganizationsWithActiveRallyes: jest.fn(),
  getDepartmentsForOrganization: jest.fn(),
  getRallyesForDepartment: jest.fn(),
  getTourModeRallyeForOrganization: jest.fn(),
  getCampusEventsDepartment: jest.fn(),
  getSelectedOrganization: jest.fn(),
  setSelectedOrganization: jest.fn(),
  clearSelectedOrganization: jest.fn(),
  getSelectedDepartment: jest.fn(),
  setSelectedDepartment: jest.fn(),
  clearSelectedDepartment: jest.fn(),
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

const mockedGetOrganizationsWithActiveRallyes =
  getOrganizationsWithActiveRallyes as jest.MockedFunction<
    typeof getOrganizationsWithActiveRallyes
  >;
const mockedGetDepartmentsForOrganization =
  getDepartmentsForOrganization as jest.MockedFunction<
    typeof getDepartmentsForOrganization
  >;
const mockedGetRallyesForDepartment =
  getRallyesForDepartment as jest.MockedFunction<
    typeof getRallyesForDepartment
  >;
const mockedGetTourModeRallyeForOrganization =
  getTourModeRallyeForOrganization as jest.MockedFunction<
    typeof getTourModeRallyeForOrganization
  >;
const mockedGetCampusEventsDepartment =
  getCampusEventsDepartment as jest.MockedFunction<
    typeof getCampusEventsDepartment
  >;
const mockedGetSelectedOrganization =
  getSelectedOrganization as jest.MockedFunction<typeof getSelectedOrganization>;
const mockedGetSelectedDepartment =
  getSelectedDepartment as jest.MockedFunction<typeof getSelectedDepartment>;
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
    mockRallyeModalProps = null;
    // Default mocks for initialization
    mockedGetSelectedOrganization.mockResolvedValue(null);
    mockedGetSelectedDepartment.mockResolvedValue(null);
    mockedGetOrganizationsWithActiveRallyes.mockResolvedValue([]);
    mockedGetCampusEventsDepartment.mockResolvedValue(null);
  });

  it('shows tour mode when no rallyes are available but tour mode exists', async () => {
    // Setup: Organization selected, department selected, no active rallyes but tour mode exists
    mockedGetSelectedOrganization.mockResolvedValue(mockOrganization);
    mockedGetSelectedDepartment.mockResolvedValue(mockDepartment);
    mockedGetOrganizationsWithActiveRallyes.mockResolvedValue([mockOrganization]);
    mockedGetDepartmentsForOrganization.mockResolvedValue([mockDepartment]);
    mockedGetRallyesForDepartment.mockResolvedValue([]);
    mockedGetTourModeRallyeForOrganization.mockResolvedValue({
      id: 1,
      name: 'Campus Tour',
      status: 'running',
      password: '',
      tour_mode: true,
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    });
    mockedGetCampusEventsDepartment.mockResolvedValue(null);

    const { getByText, queryByText } = render(<Welcome />);

    await waitFor(() => {
      expect(getByText('welcome.explore.title')).toBeTruthy();
    });

    // When tour mode exists, we should see the explore card, not the noRallyes card
    expect(getByText('welcome.explore.description')).toBeTruthy();
    expect(queryByText('welcome.noRallyes.title')).toBeNull();
    expect(queryByText('welcome.join.title')).toBeNull();
  });

  it('keeps local team when team existence is unknown during join', async () => {
    const rallye = {
      id: 5,
      name: 'Rallye',
      status: 'running',
      password: 'test123',
      tour_mode: false,
      end_time: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    const existingTeam = { id: 7, name: 'Team' };

    // Setup: Organization and department selected, one active rallye
    mockedGetSelectedOrganization.mockResolvedValue(mockOrganization);
    mockedGetSelectedDepartment.mockResolvedValue(mockDepartment);
    mockedGetOrganizationsWithActiveRallyes.mockResolvedValue([mockOrganization]);
    mockedGetDepartmentsForOrganization.mockResolvedValue([mockDepartment]);
    mockedGetRallyesForDepartment.mockResolvedValue([rallye]);
    mockedGetTourModeRallyeForOrganization.mockResolvedValue(null);
    mockedGetCampusEventsDepartment.mockResolvedValue(null);
    mockedSetCurrentRallye.mockResolvedValue();
    mockedGetCurrentTeam.mockResolvedValue(existingTeam);
    mockedTeamExists.mockResolvedValue('unknown');

    const { getByText } = render(<Welcome />);
    await waitFor(() => {
      expect(getByText('welcome.join.title')).toBeTruthy();
    });

    await act(async () => {
      await mockRallyeModalProps.onJoin(rallye);
    });

    expect(mockedClearCurrentTeam).not.toHaveBeenCalled();
    expect(store$.team.set).toHaveBeenLastCalledWith(existingTeam);
  });
});
