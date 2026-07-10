import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useEffectEvent,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import Card from '@/components/ui/Card';
import { isPasswordRequired } from '@/components/ui/RallyePasswordSheet';
import { CollapsibleHeroHeader } from '@/components/ui/CollapsibleHeroHeader';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import { store$ } from '@/services/storage/Store';
import { useSelector } from '@legendapp/state/react';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import { confirm } from '@/utils/ConfirmAlert';
import { getSoftCtaButtonStyles } from '@/utils/buttonStyles';
import {
  setCurrentRallye,
  getLocationsWithActiveRallyes,
  getLocationDashboardData,
  getSelectedLocation as getStoredLocation,
  setSelectedLocation as storeSelectedLocation,
  clearSelectedLocation,
  type LocationDashboardData,
  type RallyeRow,
} from '@/services/storage/rallyeStorage';
import {
  getCurrentTeam,
  teamExists,
  clearCurrentTeam,
} from '@/services/storage/teamStorage';
import {
  clearRallyePasswordSheetSession,
  getRallyePasswordSheetSession,
  setRallyePasswordSheetSession,
} from '@/services/rallyePasswordSheetSession';
import { Location } from '@/types/rallye';
import { Logger } from '@/utils/Logger';

type SelectionStep = 'location' | 'dashboard';
const AUTO_REFRESH_INTERVAL = 60000;

function createEmptyDashboardData(): LocationDashboardData {
  return {
    tourModeRallye: null,
    departmentEntries: [],
  };
}

export default function Welcome() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const s = useAppStyles();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  const resumeAvailable = useSelector(() => store$.resumeAvailable.get());
  const resumeRallye = useSelector(() => store$.rallye.get());
  const resumeTeam = useSelector(() => store$.team.get());

  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
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
  const isInitializedRef = useRef<boolean>(false);
  const initialSyncScheduledRef = useRef<boolean>(false);

  const stateBackground = isDarkMode
    ? Colors.darkMode.background
    : Colors.lightMode.background;
  const compactCardStyle = globalStyles.welcomeStyles.compactCard;
  const locationCardStyle = globalStyles.welcomeStyles.locationCard;
  const dashboardCardStyle = [
    compactCardStyle,
    {
      minHeight: 0,
      marginVertical: 6,
      paddingVertical: 12,
    },
  ];
  const rallyeCardStyle = [dashboardCardStyle, { marginVertical: 4 }];
  const { buttonStyle: ctaButtonStyle, textStyle: ctaButtonTextStyle } =
    getSoftCtaButtonStyles(palette);

  const applyDashboardData = useCallback((nextData: LocationDashboardData) => {
    setDashboardData(nextData);
  }, []);

  const resetDashboard = useCallback(() => {
    setDashboardData(createEmptyDashboardData());
    clearRallyePasswordSheetSession();
  }, []);

  const loadDashboardData = useCallback(
    async (locationId: number) => {
      const data = await getLocationDashboardData(locationId);
      applyDashboardData(data);
    },
    [applyDashboardData]
  );

  const initializeSelection = useCallback(async () => {
    setLoading(true);
    try {
      const savedLoc = await getStoredLocation();
      const locs = await getLocationsWithActiveRallyes();
      setLocations(locs);
      setOnline(true);

      const storedLoc = savedLoc
        ? locs.find((location) => location.id === savedLoc.id)
        : null;
      const autoSelectedLoc = locs.length === 1 ? locs[0] : null;
      const locationToSelect = storedLoc ?? autoSelectedLoc;

      if (locationToSelect) {
        if (!storedLoc && autoSelectedLoc) {
          Logger.debug(
            'AutoSelect',
            'Only one location available, auto-selecting'
          );
        }

        setSelectedLocation(locationToSelect);
        await storeSelectedLocation(locationToSelect);
        await loadDashboardData(locationToSelect.id);
        setSelectionStep('dashboard');
      } else {
        if (savedLoc) {
          await clearSelectedLocation();
        }
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
    if (getRallyePasswordSheetSession()) return;

    try {
      const locs = await getLocationsWithActiveRallyes();
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
        ) {
          return currentLocation;
        }

        return locStillValid;
      });
      await loadDashboardData(locStillValid.id);
    } catch (error) {
      Logger.error('AutoRefresh', 'Error refreshing data', error);
    }
  });

  // Effect Events are intentionally non-reactive and must stay out of deps.
  useEffect(() => {
    if (
      loading ||
      !isInitializedRef.current ||
      initialSyncScheduledRef.current
    ) {
      return;
    }

    initialSyncScheduledRef.current = true;

    const initialSyncTimeout = setTimeout(() => {
      void refreshCurrentData();
    }, 2000);

    return () => {
      clearTimeout(initialSyncTimeout);
    };
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
        ) {
          void refreshCurrentData();
        }
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

  const handleTourModeSubmit = async () => {
    if (!dashboardData.tourModeRallye) {
      Alert.alert(t('common.errorTitle'), t('welcome.tourModeUnavailable'));
      return;
    }
    store$.team.set(null);
    store$.reset();
    store$.rallye.set(dashboardData.tourModeRallye);
    await setCurrentRallye(dashboardData.tourModeRallye);
    store$.enabled.set(true);
  };

  const joinRallye = async (rallye: RallyeRow): Promise<boolean> => {
    if (joining) return false;
    setJoining(true);
    try {
      store$.team.set(null);
      store$.reset();
      store$.rallye.set(rallye);
      await setCurrentRallye(rallye);

      try {
        const existingTeam = await getCurrentTeam(rallye.id);
        if (existingTeam) {
          const exists = await teamExists(rallye.id, existingTeam.id);
          if (exists === 'exists') {
            store$.team.set(existingTeam);
          } else if (exists === 'missing') {
            await clearCurrentTeam(rallye.id);
            store$.team.set(null);
          } else {
            store$.team.set(existingTeam);
          }
        }
      } catch (rehydrateError) {
        Logger.error(
          'Welcome',
          'Error rehydrating team after join',
          rehydrateError
        );
        store$.team.set(null);
      }

      store$.enabled.set(true);
      return true;
    } catch (error) {
      Logger.error('Welcome', 'Error joining rallye', error);
      Alert.alert(t('common.errorTitle'), t('welcome.participationStartError'));
      return false;
    } finally {
      setJoining(false);
    }
  };

  const handleRallyePress = async (rallye: RallyeRow) => {
    if (joining) return;
    if (isPasswordRequired(rallye)) {
      if (getRallyePasswordSheetSession()) return;
      setRallyePasswordSheetSession({
        rallye,
        onJoin: joinRallye,
      });
      router.push('/rallye-password-sheet');
      return;
    }
    await joinRallye(rallye);
  };

  const LoadingContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.offline,
        { backgroundColor: stateBackground },
      ]}
    >
      <ActivityIndicator size="large" color={Colors.dhbwRed} />
      <ThemedText
        variant="body"
        style={[globalStyles.welcomeStyles.text, s.muted, { marginTop: 16 }]}
      >
        {t('common.loading')}
      </ThemedText>
    </View>
  );

  const OfflineContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.offline,
        { backgroundColor: stateBackground },
      ]}
    >
      <ThemedText
        variant="body"
        style={[globalStyles.welcomeStyles.text, s.muted, { marginBottom: 20 }]}
      >
        {t('welcome.offline')}
      </ThemedText>
      <UIButton icon="rotate" onPress={() => void initializeSelection()}>
        {t('common.refresh')}
      </UIButton>
    </View>
  );

  const LocationContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.container,
        { backgroundColor: stateBackground },
      ]}
    >
      {locations.length === 0 && (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.selectLocation.title')}
          description={t('welcome.selectLocation.empty')}
          icon="info.circle"
        />
      )}
      {locations.length > 0 && (
        <>
          <ThemedText
            variant="bodySmall"
            style={[
              s.muted,
              { textAlign: 'left', width: '100%', marginBottom: 8 },
            ]}
          >
            {t('welcome.selectLocation.description')}
          </ThemedText>
          {locations.map((location) => (
            <Card
              key={location.id}
              containerStyle={locationCardStyle}
              title={location.name}
              icon="building.2"
              onPress={() => void handleLocationSelect(location)}
            />
          ))}
        </>
      )}
    </View>
  );

  const hasDashboardContent =
    !!dashboardData.tourModeRallye || dashboardData.departmentEntries.length > 0;

  const DashboardContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.container,
        { backgroundColor: stateBackground },
      ]}
    >
      {resumeAvailable && resumeRallye && resumeTeam && (
        <Card
          containerStyle={dashboardCardStyle}
          title={t('welcome.resume.title')}
          description={t('welcome.resume.details', {
            rallye: resumeRallye.name,
            team: resumeTeam.name,
          })}
          icon="clock"
        >
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <UIButton
                onPress={() => store$.enabled.set(true)}
                style={ctaButtonStyle}
                textStyle={ctaButtonTextStyle}
              >
                {t('common.resume')}
              </UIButton>
            </View>
            <View style={{ flex: 1 }}>
              <UIButton
                outline
                color={Colors.dhbwRed}
                onPress={() => {
                  void (async () => {
                    const confirmed = await confirm({
                      title: t('welcome.clearParticipation.title'),
                      message: t('welcome.clearParticipation.message'),
                      confirmText: t('welcome.clearParticipation.confirm'),
                      cancelText: t('common.cancel'),
                      destructive: true,
                    });
                    if (!confirmed) return;
                    void store$.leaveRallye();
                  })();
                }}
              >
                {t('common.startOver')}
              </UIButton>
            </View>
          </View>
        </Card>
      )}

      {dashboardData.departmentEntries
        .flatMap((entry) =>
          entry.rallyes.map((rallye) => ({
            rallye,
            departmentName: entry.department.name,
          }))
        )
        .map(({ rallye, departmentName }) => (
          <Card
            key={rallye.id}
            containerStyle={rallyeCardStyle}
            title={rallye.name.trim() || departmentName}
            icon="graduationcap"
          >
            <UIButton
              disabled={joining}
              onPress={() => void handleRallyePress(rallye)}
              style={ctaButtonStyle}
              textStyle={ctaButtonTextStyle}
            >
              {t('rallye.join')}
            </UIButton>
          </Card>
        ))}

      {dashboardData.tourModeRallye && (
        <Card
          containerStyle={dashboardCardStyle}
          title={t('welcome.explore.title')}
          icon="binoculars"
        >
          <UIButton
            onPress={() => void handleTourModeSubmit()}
            style={ctaButtonStyle}
            textStyle={ctaButtonTextStyle}
          >
            {t('welcome.explore.start')}
          </UIButton>
        </Card>
      )}

      {!hasDashboardContent && (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <ThemedText
            variant="body"
            style={[s.text, { textAlign: 'center', marginBottom: 16 }]}
          >
            {t('welcome.noContent')}
          </ThemedText>
          <UIButton icon="arrow.backward" onPress={() => void handleBack()}>
            {t('common.back')}
          </UIButton>
        </View>
      )}
    </View>
  );

  const getHeaderTitle = () => {
    if (selectedLocation) {
      return `${selectedLocation.name} Campus Rallyes`;
    }
    return 'Campus Rallyes';
  };

  const renderCurrentStep = () => {
    if (selectionStep === 'location') return <LocationContent />;
    return <DashboardContent />;
  };

  return (
    <CollapsibleHeroHeader
      heroImage={require('../assets/images/app/dhbw-campus-header.png')}
      logoImage={require('../assets/images/app/dhbw-logo.png')}
      title={getHeaderTitle()}
      showBackButton={selectionStep === 'dashboard' && locations.length > 1}
      onBackPress={handleBack}
    >
      {loading && <LoadingContent />}
      {!loading && online && renderCurrentStep()}
      {!loading && !online && <OfflineContent />}
    </CollapsibleHeroHeader>
  );
}
