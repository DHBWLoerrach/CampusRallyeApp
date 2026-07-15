import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import {
  clearRallyeCodeSheetSession,
  getRallyeCodeSheetSession,
} from '@/services/rallyeCodeSheetSession';
import { store$ } from '@/services/storage/Store';
import {
  clearSelectedLocation,
  getLocationDashboardData,
  getLocationsWithJoinableRallyes,
  getSelectedLocation as getStoredLocation,
  setSelectedLocation as storeSelectedLocation,
  type LocationDashboardData,
} from '@/services/storage/rallyeStorage';
import type { Location } from '@/types/rallye';
import { Logger } from '@/utils/Logger';
import { useLanguage } from '@/utils/LanguageContext';

type SelectionStep = 'location' | 'dashboard';
const AUTO_REFRESH_INTERVAL = 60000;

function createEmptyDashboardData(): LocationDashboardData {
  return { tourModeRallye: null, departmentEntries: [] };
}

export function useLocationDashboard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [selectionStep, setSelectionStep] = useState<SelectionStep>('location');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [locations, setLocations] = useState<Location[]>([]);
  const [dashboardData, setDashboardData] = useState<LocationDashboardData>(
    () => createEmptyDashboardData()
  );
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isInitializedRef = useRef(false);
  const initialSyncScheduledRef = useRef(false);

  const resetDashboard = useCallback(() => {
    setDashboardData(createEmptyDashboardData());
    clearRallyeCodeSheetSession();
  }, []);
  const loadDashboardData = useCallback(async (locationId: number) => {
    setDashboardData(await getLocationDashboardData(locationId));
  }, []);

  const initializeSelection = useCallback(async () => {
    setLoading(true);
    try {
      const savedLoc = await getStoredLocation();
      const locs = await getLocationsWithJoinableRallyes();
      setLocations(locs);
      setOnline(true);
      const storedLoc = savedLoc
        ? locs.find((location) => location.id === savedLoc.id)
        : null;
      const autoSelectedLoc = locs.length === 1 ? locs[0] : null;
      const locationToSelect = storedLoc ?? autoSelectedLoc;
      if (locationToSelect) {
        if (!storedLoc && autoSelectedLoc)
          Logger.debug(
            'AutoSelect',
            'Only one location available, auto-selecting'
          );
        setSelectedLocation(locationToSelect);
        await storeSelectedLocation(locationToSelect);
        await loadDashboardData(locationToSelect.id);
        setSelectionStep('dashboard');
      } else {
        if (savedLoc) await clearSelectedLocation();
        setSelectedLocation(null);
        resetDashboard();
        setSelectionStep('location');
      }
    } catch (error) {
      Logger.error('Welcome', 'Error initializing selection', error);
      setOnline(false);
      setSelectionStep('location');
    } finally {
      setLoading(false);
      isInitializedRef.current = true;
    }
  }, [loadDashboardData, resetDashboard]);

  useEffect(() => {
    void initializeSelection();
  }, [initializeSelection]);

  const refreshCurrentData = useEffectEvent(async () => {
    if (loading || !isInitializedRef.current) return;
    if (store$.enabled.get()) return;
    if (appStateRef.current !== 'active') return;
    if (getRallyeCodeSheetSession()) return;
    try {
      const locs = await getLocationsWithJoinableRallyes();
      setLocations(locs);
      setOnline(true);
      if (selectionStep === 'location') return;
      if (!selectedLocation) {
        setSelectionStep('location');
        return;
      }
      const locStillValid = locs.find(
        (location) => location.id === selectedLocation.id
      );
      if (!locStillValid) {
        await clearSelectedLocation();
        setSelectedLocation(null);
        resetDashboard();
        setSelectionStep('location');
        return;
      }
      setSelectedLocation((currentLocation) => {
        if (
          currentLocation &&
          currentLocation.id === locStillValid.id &&
          currentLocation.name === locStillValid.name &&
          currentLocation.default_rallye_id ===
            locStillValid.default_rallye_id &&
          currentLocation.created_at === locStillValid.created_at
        )
          return currentLocation;
        return locStillValid;
      });
      await loadDashboardData(locStillValid.id);
    } catch (error) {
      Logger.error('AutoRefresh', 'Error refreshing data', error);
    }
  });

  // Effect Events are intentionally non-reactive and must stay out of deps.
  useEffect(() => {
    if (loading || !isInitializedRef.current || initialSyncScheduledRef.current)
      return;
    initialSyncScheduledRef.current = true;
    const initialSyncTimeout = setTimeout(() => {
      void refreshCurrentData();
    }, 2000);
    return () => clearTimeout(initialSyncTimeout);
  }, [loading]);

  // Effect Events are intentionally non-reactive and must stay out of deps.
  useEffect(() => {
    const intervalId = setInterval(() => {
      void refreshCurrentData();
    }, AUTO_REFRESH_INTERVAL);
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        )
          void refreshCurrentData();
        appStateRef.current = nextAppState;
      }
    );
    return () => {
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, []);

  const handleLocationSelect = async (location: Location) => {
    setSelectedLocation(location);
    setLoading(true);
    try {
      await storeSelectedLocation(location);
      await loadDashboardData(location.id);
      setSelectionStep('dashboard');
    } catch (error) {
      Logger.error('Welcome', 'Error loading location dashboard', error);
      Alert.alert(t('common.errorTitle'), t('welcome.departmentLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    if (selectionStep !== 'dashboard') return;
    await clearSelectedLocation();
    setSelectedLocation(null);
    resetDashboard();
    setSelectionStep('location');
  };

  return {
    loading,
    online,
    selectionStep,
    selectedLocation,
    locations,
    dashboardData,
    initializeSelection,
    handleLocationSelect,
    handleBack,
  };
}
