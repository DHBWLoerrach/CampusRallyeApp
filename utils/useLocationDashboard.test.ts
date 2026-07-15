import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useLocationDashboard } from './useLocationDashboard';
import {
  clearSelectedLocation,
  getLocationDashboardData,
  getLocationsWithJoinableRallyes,
  getSelectedLocation,
  setSelectedLocation,
} from '@/services/storage/rallyeStorage';

jest.mock('@/services/storage/rallyeStorage', () => ({
  clearSelectedLocation: jest.fn(),
  getLocationDashboardData: jest.fn(),
  getLocationsWithJoinableRallyes: jest.fn(),
  getSelectedLocation: jest.fn(),
  setSelectedLocation: jest.fn(),
}));

jest.mock('@/services/rallyeCodeSheetSession', () => ({
  clearRallyeCodeSheetSession: jest.fn(),
  getRallyeCodeSheetSession: jest.fn(() => null),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: { enabled: { get: jest.fn(() => false) } },
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

const firstLocation = {
  id: 1,
  name: 'Campus A',
  default_rallye_id: null,
  created_at: '2024-01-01T00:00:00Z',
};
const secondLocation = { ...firstLocation, id: 2, name: 'Campus B' };
const emptyDashboard = { tourModeRallye: null, departmentEntries: [] };

// Interval and AppState behavior stays covered by app/__tests__/index.test.tsx.
describe('useLocationDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getSelectedLocation).mockResolvedValue(null);
    jest.mocked(getLocationsWithJoinableRallyes).mockResolvedValue([]);
    jest.mocked(getLocationDashboardData).mockResolvedValue(emptyDashboard);
  });

  it('loads and auto-selects the only available location', async () => {
    jest
      .mocked(getLocationsWithJoinableRallyes)
      .mockResolvedValue([firstLocation]);

    const { result } = renderHook(() => useLocationDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.locations).toEqual([firstLocation]);
    expect(result.current.selectedLocation).toEqual(firstLocation);
    expect(result.current.selectionStep).toBe('dashboard');
    expect(setSelectedLocation).toHaveBeenCalledWith(firstLocation);
    expect(getLocationDashboardData).toHaveBeenCalledWith(firstLocation.id);
  });

  it('clears a stored location that is no longer available', async () => {
    jest.mocked(getSelectedLocation).mockResolvedValue(firstLocation);
    jest
      .mocked(getLocationsWithJoinableRallyes)
      .mockResolvedValue([secondLocation, { ...secondLocation, id: 3 }]);

    const { result } = renderHook(() => useLocationDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(clearSelectedLocation).toHaveBeenCalled();
    expect(result.current.selectedLocation).toBeNull();
    expect(result.current.selectionStep).toBe('location');
  });

  it('marks the dashboard offline when initialization fails', async () => {
    jest
      .mocked(getLocationsWithJoinableRallyes)
      .mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useLocationDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.online).toBe(false);
    expect(result.current.selectionStep).toBe('location');
  });

  it('clears the stored location and returns to selection on back', async () => {
    jest
      .mocked(getLocationsWithJoinableRallyes)
      .mockResolvedValue([firstLocation]);
    const { result } = renderHook(() => useLocationDashboard());
    await waitFor(() => expect(result.current.selectionStep).toBe('dashboard'));

    await act(async () => {
      await result.current.handleBack();
    });

    expect(clearSelectedLocation).toHaveBeenCalled();
    expect(result.current.selectedLocation).toBeNull();
    expect(result.current.selectionStep).toBe('location');
  });
});
