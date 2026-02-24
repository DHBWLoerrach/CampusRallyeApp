import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  View,
} from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import Card from '@/components/ui/Card';
import SelectionModal, { SelectionItem } from '@/components/ui/SelectionModal';
import RallyePasswordSheet, {
  isPasswordRequired,
} from '@/components/ui/RallyePasswordSheet';
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
  getOrganizationsWithActiveRallyes,
  getOrganizationDashboardData,
  getSelectedOrganization as getStoredOrganization,
  setSelectedOrganization as storeSelectedOrganization,
  clearSelectedOrganization,
  type OrganizationDashboardData,
  type RallyeRow,
} from '@/services/storage/rallyeStorage';
import {
  getCurrentTeam,
  teamExists,
  clearCurrentTeam,
} from '@/services/storage/teamStorage';
import { Organization } from '@/types/rallye';
import { Logger } from '@/utils/Logger';

type SelectionStep = 'organization' | 'dashboard';

function createEmptyDashboardData(): OrganizationDashboardData {
  return {
    tourModeRallye: null,
    campusEventsRallyes: [],
    departmentEntries: [],
  };
}

export default function Welcome() {
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

  const [selectionStep, setSelectionStep] = useState<SelectionStep>(
    'organization'
  );
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [dashboardData, setDashboardData] = useState<OrganizationDashboardData>(
    () => createEmptyDashboardData()
  );
  const [expandedDepartmentIds, setExpandedDepartmentIds] = useState<number[]>(
    []
  );

  const [showOrgModal, setShowOrgModal] = useState(false);
  const [passwordRallye, setPasswordRallye] = useState<RallyeRow | null>(null);

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isInitializedRef = useRef<boolean>(false);
  const AUTO_REFRESH_INTERVAL = 60000;

  const stateBackground = isDarkMode
    ? Colors.darkMode.background
    : Colors.lightMode.background;
  const compactCardStyle = globalStyles.welcomeStyles.compactCard;
  const organizationCardStyle = globalStyles.welcomeStyles.organizationCard;
  const dashboardCardStyle = [
    compactCardStyle,
    {
      minHeight: 0,
      marginVertical: 6,
      paddingVertical: 12,
    },
  ];
  const departmentCardStyle = [dashboardCardStyle, { marginVertical: 4 }];
  const { buttonStyle: ctaButtonStyle, textStyle: ctaButtonTextStyle } =
    getSoftCtaButtonStyles(palette);
  const closeSelectionButtonStyle = [
    ctaButtonStyle,
    { backgroundColor: palette.surface1 },
  ];
  const closeSelectionButtonTextStyle = { color: palette.text };

  const applyDashboardData = useCallback((nextData: OrganizationDashboardData) => {
    setDashboardData(nextData);
    setExpandedDepartmentIds((currentExpandedIds) =>
      currentExpandedIds.filter((departmentId) =>
        nextData.departmentEntries.some(
          (entry) => entry.department.id === departmentId
        )
      )
    );
  }, []);

  const resetDashboard = useCallback(() => {
    setDashboardData(createEmptyDashboardData());
    setExpandedDepartmentIds([]);
    setPasswordRallye(null);
  }, []);

  const loadDashboardData = useCallback(
    async (organizationId: number) => {
      const data = await getOrganizationDashboardData(organizationId);
      applyDashboardData(data);
    },
    [applyDashboardData]
  );

  const initializeSelection = useCallback(async () => {
    setLoading(true);
    try {
      const savedOrg = await getStoredOrganization();
      const orgs = await getOrganizationsWithActiveRallyes();
      setOrganizations(orgs);
      setOnline(true);

      const storedOrg = savedOrg
        ? orgs.find((organization) => organization.id === savedOrg.id)
        : null;
      const autoSelectedOrg = orgs.length === 1 ? orgs[0] : null;
      const organizationToSelect = storedOrg ?? autoSelectedOrg;

      if (organizationToSelect) {
        if (!storedOrg && autoSelectedOrg) {
          Logger.debug(
            'AutoSelect',
            'Only one organization available, auto-selecting'
          );
        }

        setSelectedOrganization(organizationToSelect);
        await storeSelectedOrganization(organizationToSelect);
        await loadDashboardData(organizationToSelect.id);
        setSelectionStep('dashboard');
      } else {
        if (savedOrg) {
          await clearSelectedOrganization();
        }
        setSelectedOrganization(null);
        resetDashboard();
        setSelectionStep('organization');
      }
    } catch (error) {
      Logger.error('Welcome', 'Error initializing selection', error);
      setOnline(false);
      setSelectionStep('organization');
    } finally {
      setLoading(false);
      isInitializedRef.current = true;
    }
  }, [loadDashboardData, resetDashboard]);

  useEffect(() => {
    void initializeSelection();
  }, [initializeSelection]);

  const refreshCurrentData = useCallback(async () => {
    if (loading || !isInitializedRef.current) return;
    if (store$.enabled.get()) return;
    if (appStateRef.current !== 'active') return;
    if (showOrgModal || passwordRallye) return;

    try {
      const orgs = await getOrganizationsWithActiveRallyes();
      setOrganizations(orgs);
      setOnline(true);

      if (selectionStep === 'organization') return;

      if (!selectedOrganization) {
        setSelectionStep('organization');
        return;
      }

      const orgStillValid = orgs.find(
        (organization) => organization.id === selectedOrganization.id
      );

      if (!orgStillValid) {
        await clearSelectedOrganization();
        setSelectedOrganization(null);
        resetDashboard();
        setSelectionStep('organization');
        return;
      }

      setSelectedOrganization(orgStillValid);
      await loadDashboardData(orgStillValid.id);
    } catch (error) {
      Logger.error('AutoRefresh', 'Error refreshing data', error);
    }
  }, [
    loading,
    showOrgModal,
    passwordRallye,
    selectionStep,
    selectedOrganization,
    loadDashboardData,
    resetDashboard,
  ]);

  useEffect(() => {
    const initialSyncTimeout = setTimeout(() => {
      if (isInitializedRef.current) {
        void refreshCurrentData();
      }
    }, 2000);

    refreshIntervalRef.current = setInterval(() => {
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
      clearTimeout(initialSyncTimeout);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      appStateSubscription.remove();
    };
  }, [refreshCurrentData]);

  const handleOrganizationSelect = async (organization: Organization) => {
    setSelectedOrganization(organization);
    setLoading(true);
    try {
      await storeSelectedOrganization(organization);
      await loadDashboardData(organization.id);
      setSelectionStep('dashboard');
    } catch (error) {
      Logger.error('Welcome', 'Error loading organization dashboard', error);
      Alert.alert(t('common.errorTitle'), t('welcome.departmentLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    if (selectionStep !== 'dashboard') return;
    await clearSelectedOrganization();
    setSelectedOrganization(null);
    resetDashboard();
    setSelectionStep('organization');
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
      setPasswordRallye(rallye);
      return;
    }
    await joinRallye(rallye);
  };

  const toggleDepartmentExpansion = (departmentId: number) => {
    setExpandedDepartmentIds((currentExpandedIds) => {
      if (currentExpandedIds.includes(departmentId)) {
        return currentExpandedIds.filter((id) => id !== departmentId);
      }
      return [...currentExpandedIds, departmentId];
    });
  };

  const handleOrgModalSelect = (item: SelectionItem) => {
    const organization = organizations.find((org) => org.id === item.id);
    if (organization) {
      setShowOrgModal(false);
      void handleOrganizationSelect(organization);
    }
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
        style={[
          globalStyles.welcomeStyles.text,
          s.muted,
          { marginBottom: 20 },
        ]}
      >
        {t('welcome.offline')}
      </ThemedText>
      <UIButton icon="rotate" onPress={() => void initializeSelection()}>
        {t('common.refresh')}
      </UIButton>
    </View>
  );

  const OrganizationContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.container,
        { backgroundColor: stateBackground },
      ]}
    >
      {organizations.length === 0 && (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.selectLocation.title')}
          description={t('welcome.selectLocation.empty')}
          icon="info.circle"
        />
      )}
      {organizations.length > 0 && organizations.length <= 3 && (
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
          {organizations.map((organization) => (
            <Card
              key={organization.id}
              containerStyle={organizationCardStyle}
              title={organization.name}
              icon="building.2"
              onPress={() => void handleOrganizationSelect(organization)}
            />
          ))}
        </>
      )}
      {organizations.length > 3 && (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.selectLocation.title')}
          description={t('welcome.selectLocation.description')}
          icon="building.2"
        >
          <UIButton
            onPress={() => setShowOrgModal(true)}
            style={ctaButtonStyle}
            textStyle={ctaButtonTextStyle}
          >
            {t('welcome.selectLocation.button')}
          </UIButton>
        </Card>
      )}
    </View>
  );

  const hasDashboardContent =
    !!dashboardData.tourModeRallye ||
    dashboardData.campusEventsRallyes.length > 0 ||
    dashboardData.departmentEntries.length > 0;

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

      {dashboardData.departmentEntries.map((entry) => {
        const rallyes = entry.rallyes;
        const multipleRallyes = rallyes.length > 1;
        const expanded = expandedDepartmentIds.includes(entry.department.id);

        return (
          <Card
            key={entry.department.id}
            containerStyle={departmentCardStyle}
            title={entry.department.name}
            icon="graduationcap"
          >
            {!multipleRallyes && rallyes[0] && (
              <UIButton
                disabled={joining}
                onPress={() => void handleRallyePress(rallyes[0])}
                style={ctaButtonStyle}
                textStyle={ctaButtonTextStyle}
              >
                {t('rallye.join')}
              </UIButton>
            )}

            {multipleRallyes && (
              <>
                <UIButton
                  disabled={joining}
                  onPress={() => toggleDepartmentExpansion(entry.department.id)}
                  style={expanded ? closeSelectionButtonStyle : ctaButtonStyle}
                  textStyle={
                    expanded
                      ? closeSelectionButtonTextStyle
                      : ctaButtonTextStyle
                  }
                >
                  {expanded ? t('welcome.join.hide') : t('welcome.join.select')}
                </UIButton>
                {expanded && (
                  <View style={{ marginTop: 10 }}>
                    {rallyes.map((rallye, index) => (
                      <View
                        key={rallye.id}
                        style={index > 0 ? { marginTop: 8 } : undefined}
                      >
                        <UIButton
                          disabled={joining}
                          onPress={() => void handleRallyePress(rallye)}
                          style={ctaButtonStyle}
                          textStyle={ctaButtonTextStyle}
                        >
                          {rallye.name}
                        </UIButton>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </Card>
        );
      })}

      {dashboardData.campusEventsRallyes.length > 0 && (
        <Card
          containerStyle={dashboardCardStyle}
          title={t('welcome.campusEvents.title')}
          icon="party.popper"
        >
          {dashboardData.campusEventsRallyes.map((rallye, index) => (
            <View
              key={rallye.id}
              style={index > 0 ? { marginTop: 8 } : undefined}
            >
              <UIButton
                disabled={joining}
                onPress={() => void handleRallyePress(rallye)}
                style={ctaButtonStyle}
                textStyle={ctaButtonTextStyle}
              >
                {rallye.name}
              </UIButton>
            </View>
          ))}
        </Card>
      )}

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
    if (selectedOrganization) {
      return `${selectedOrganization.name} Campus Rallyes`;
    }
    return 'Campus Rallyes';
  };

  const renderCurrentStep = () => {
    if (selectionStep === 'organization') return <OrganizationContent />;
    return <DashboardContent />;
  };

  return (
    <CollapsibleHeroHeader
      heroImage={require('../assets/images/app/dhbw-campus-header.png')}
      logoImage={require('../assets/images/app/dhbw-logo.png')}
      title={getHeaderTitle()}
      showBackButton={selectionStep === 'dashboard' && organizations.length > 1}
      onBackPress={handleBack}
    >
      {loading && <LoadingContent />}
      {!loading && online && renderCurrentStep()}
      {!loading && !online && <OfflineContent />}

      <SelectionModal
        visible={showOrgModal}
        onClose={() => setShowOrgModal(false)}
        items={organizations.map((organization) => ({
          id: organization.id,
          name: organization.name,
        }))}
        onSelect={handleOrgModalSelect}
        title={t('welcome.selectLocation.modalTitle')}
        emptyMessage={t('welcome.selectLocation.empty')}
      />

      <RallyePasswordSheet
        visible={!!passwordRallye}
        rallye={passwordRallye}
        joining={joining}
        onClose={() => setPasswordRallye(null)}
        onJoin={joinRallye}
      />
    </CollapsibleHeroHeader>
  );
}
