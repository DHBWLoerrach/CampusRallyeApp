import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  type AppStateStatus,
  View,
} from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import Card from '@/components/ui/Card';
import RallyeSelectionModal from '@/components/ui/RallyeSelectionModal';
import SelectionModal, { SelectionItem } from '@/components/ui/SelectionModal';
import { CollapsibleHeroHeader } from '@/components/ui/CollapsibleHeroHeader';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import { store$ } from '@/services/storage/Store';
import { useSelector } from '@legendapp/state/react';
import NetInfo from '@react-native-community/netinfo';
import ThemedText from '@/components/themed/ThemedText';
import { confirm } from '@/utils/ConfirmAlert';
import { useAppStyles } from '@/utils/AppStyles';
import {
  setCurrentRallye,
  getOrganizationsWithActiveRallyes,
  getDepartmentsForOrganization,
  getRallyesForDepartment,
  getTourModeRallyeForOrganization,
  getSelectedOrganization as getStoredOrganization,
  setSelectedOrganization as storeSelectedOrganization,
  clearSelectedOrganization,
  getSelectedDepartment as getStoredDepartment,
  setSelectedDepartment as storeSelectedDepartment,
  clearSelectedDepartment,
  type RallyeRow,
} from '@/services/storage/rallyeStorage';
import {
  getCurrentTeam,
  teamExists,
  clearCurrentTeam,
} from '@/services/storage/teamStorage';
import type { Department, Organization } from '@/types/rallye';

// Typen für die Auswahl-Phasen

type SelectionStep = 'organization' | 'department' | 'rallye';

const AUTO_REFRESH_INTERVAL = 20000; // 20 Sekunden

export default function Welcome() {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const s = useAppStyles();

  const resumeAvailable = useSelector(() => store$.resumeAvailable.get());
  const resumeRallye = useSelector(() => store$.rallye.get());
  const resumeTeam = useSelector(() => store$.team.get());

  const [fetchState, setFetchState] = useState<
    'loading' | 'ready' | 'offline' | 'empty' | 'error'
  >('loading');
  const [joining, setJoining] = useState(false);

  const [selectionStep, setSelectionStep] = useState<SelectionStep>(
    'organization'
  );
  const [selectedOrganization, setSelectedOrganization] = useState<
    Organization | null
  >(null);
  const [selectedDepartment, setSelectedDepartment] = useState<
    Department | null
  >(null);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeRallyes, setActiveRallyes] = useState<RallyeRow[]>([]);
  const [tourModeRallye, setTourModeRallye] = useState<RallyeRow | null>(null);

  const [showRallyeModal, setShowRallyeModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isInitializedRef = useRef<boolean>(false);

  const hasActiveRallyes = activeRallyes.length > 0;
  const hasTourMode = !!tourModeRallye;

  const checkOffline = useCallback(async () => {
    try {
      const netState = await NetInfo.fetch();
      return (
        netState.isConnected === false ||
        netState.isInternetReachable === false
      );
    } catch (error) {
      console.error('Error checking network status:', error);
      return true;
    }
  }, []);

  const initializeSelection = useCallback(async () => {
    setFetchState('loading');

    const isOffline = await checkOffline();
    if (isOffline) {
      setFetchState('offline');
      return;
    }

    try {
      const [savedOrg, savedDept] = await Promise.all([
        getStoredOrganization(),
        getStoredDepartment(),
      ]);

      const orgs = await getOrganizationsWithActiveRallyes();
      if (orgs.length === 0) {
        setOrganizations([]);
        setDepartments([]);
        setActiveRallyes([]);
        setTourModeRallye(null);
        setSelectedOrganization(null);
        setSelectedDepartment(null);
        setSelectionStep('organization');
        setFetchState('empty');
        isInitializedRef.current = true;
        return;
      }

      setOrganizations(orgs);

      let resolvedOrg = savedOrg
        ? orgs.find((org) => org.id === savedOrg.id) ?? null
        : null;

      if (!resolvedOrg && orgs.length === 1) {
        resolvedOrg = orgs[0];
        await storeSelectedOrganization(resolvedOrg);
      } else if (!resolvedOrg && savedOrg) {
        await clearSelectedOrganization();
      }

      if (!resolvedOrg) {
        setSelectedOrganization(null);
        setSelectedDepartment(null);
        setDepartments([]);
        setActiveRallyes([]);
        setTourModeRallye(null);
        setSelectionStep('organization');
        setFetchState('ready');
        isInitializedRef.current = true;
        return;
      }

      setSelectedOrganization(resolvedOrg);

      const depts = await getDepartmentsForOrganization(resolvedOrg.id);
      setDepartments(depts);
      const tourRallye = await getTourModeRallyeForOrganization(resolvedOrg.id);
      setTourModeRallye(tourRallye);

      let resolvedDept = savedDept
        ? depts.find((dept) => dept.id === savedDept.id) ?? null
        : null;

      if (!resolvedDept && depts.length === 1) {
        resolvedDept = depts[0];
        await storeSelectedDepartment(resolvedDept);
      } else if (!resolvedDept && savedDept) {
        await clearSelectedDepartment();
      }

      if (resolvedDept) {
        setSelectedDepartment(resolvedDept);
        const rallyes = await getRallyesForDepartment(resolvedDept.id);
        setActiveRallyes(rallyes);
        setSelectionStep('rallye');
      } else {
        setSelectedDepartment(null);
        setActiveRallyes([]);
        setSelectionStep('department');
      }

      setFetchState('ready');
    } catch (error) {
      console.error('Error initializing selection:', error);
      setFetchState('error');
    } finally {
      isInitializedRef.current = true;
    }
  }, [checkOffline]);

  useEffect(() => {
    void initializeSelection();
  }, [initializeSelection]);

  const refreshCurrentData = useCallback(async () => {
    if (fetchState === 'loading' || !isInitializedRef.current) return;
    if (store$.enabled.get()) return;
    if (appStateRef.current !== 'active') return;
    if (showRallyeModal || showOrgModal || showDeptModal) return;

    try {
      if (selectionStep === 'organization') {
        const orgs = await getOrganizationsWithActiveRallyes();
        setOrganizations(orgs);
        if (orgs.length === 0) {
          setSelectionStep('organization');
          setFetchState('empty');
        }
        return;
      }

      if (selectionStep === 'department' && selectedOrganization) {
        const orgs = await getOrganizationsWithActiveRallyes();
        const orgStillValid = orgs.find(
          (org) => org.id === selectedOrganization.id
        );

        if (!orgStillValid) {
          await clearSelectedOrganization();
          setSelectedOrganization(null);
          setSelectedDepartment(null);
          setDepartments([]);
          setActiveRallyes([]);
          setTourModeRallye(null);
          setOrganizations(orgs);
          setSelectionStep('organization');
          return;
        }

        setOrganizations(orgs);
        const depts = await getDepartmentsForOrganization(
          selectedOrganization.id
        );
        setDepartments(depts);
        const tourRallye = await getTourModeRallyeForOrganization(
          selectedOrganization.id
        );
        setTourModeRallye(tourRallye);

        if (depts.length === 0 && !tourRallye) {
          await clearSelectedOrganization();
          setSelectedOrganization(null);
          setSelectedDepartment(null);
          setDepartments([]);
          setActiveRallyes([]);
          setTourModeRallye(null);
          setSelectionStep('organization');
        }
        return;
      }

      if (selectionStep === 'rallye' && selectedOrganization && selectedDepartment) {
        const depts = await getDepartmentsForOrganization(
          selectedOrganization.id
        );
        const deptStillValid = depts.find(
          (dept) => dept.id === selectedDepartment.id
        );

        if (!deptStillValid) {
          await clearSelectedDepartment();
          setSelectedDepartment(null);
          setActiveRallyes([]);
          setDepartments(depts);
          setSelectionStep('department');
          return;
        }

        setDepartments(depts);
        const rallyes = await getRallyesForDepartment(selectedDepartment.id);
        setActiveRallyes(rallyes);
        const tourRallye = await getTourModeRallyeForOrganization(
          selectedOrganization.id
        );
        setTourModeRallye(tourRallye);

        if (rallyes.length === 0 && !tourRallye) {
          await clearSelectedDepartment();
          setSelectedDepartment(null);
          setActiveRallyes([]);
          setDepartments(depts);
          setSelectionStep('department');
        }
      }
    } catch (error) {
      console.error('[Auto-Refresh] Error updating data:', error);
    }
  }, [
    fetchState,
    selectionStep,
    selectedOrganization,
    selectedDepartment,
    showRallyeModal,
    showOrgModal,
    showDeptModal,
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

  const joinRallye = async (rallye: RallyeRow): Promise<boolean> => {
    if (joining) return false;
    setJoining(true);
    try {
      store$.team.set(null);
      store$.reset();
      store$.rallye.set(rallye);
      await setCurrentRallye(rallye);

      // Rehydrate previously created team for this rallye (if any)
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
      } catch (rehydrateErr) {
        console.error('Error rehydrating team after join:', rehydrateErr);
        store$.team.set(null);
      }

      store$.enabled.set(true);
      return true;
    } catch (e) {
      console.error('Error joining rallye:', e);
      Alert.alert(t('common.errorTitle'), t('welcome.participationStartError'));
      return false;
    } finally {
      setJoining(false);
    }
  };

  const startTourMode = async () => {
    if (!tourModeRallye) {
      Alert.alert(t('common.errorTitle'), t('welcome.tourModeUnavailable'));
      return;
    }

    try {
      store$.team.set(null);
      store$.reset();
      store$.rallye.set(tourModeRallye);
      await setCurrentRallye(tourModeRallye);
      store$.enabled.set(true);
    } catch (error) {
      console.error('Error starting tour mode:', error);
      Alert.alert(t('common.errorTitle'), t('welcome.participationStartError'));
    }
  };

  const handleOrganizationSelect = async (org: Organization) => {
    setFetchState('loading');
    setSelectedOrganization(org);
    setSelectedDepartment(null);
    setActiveRallyes([]);

    try {
      await storeSelectedOrganization(org);
      const depts = await getDepartmentsForOrganization(org.id);
      setDepartments(depts);
      const tourRallye = await getTourModeRallyeForOrganization(org.id);
      setTourModeRallye(tourRallye);

      if (depts.length === 1) {
        const singleDept = depts[0];
        setSelectedDepartment(singleDept);
        await storeSelectedDepartment(singleDept);
        const rallyes = await getRallyesForDepartment(singleDept.id);
        setActiveRallyes(rallyes);
        setSelectionStep('rallye');
      } else {
        setSelectionStep('department');
      }

      setFetchState('ready');
    } catch (error) {
      console.error('Error loading departments:', error);
      Alert.alert(t('common.errorTitle'), t('welcome.error'));
      setFetchState('error');
    }
  };

  const handleDepartmentSelect = async (dept: Department) => {
    setFetchState('loading');
    setSelectedDepartment(dept);
    setActiveRallyes([]);

    try {
      await storeSelectedDepartment(dept);
      const rallyes = await getRallyesForDepartment(dept.id);
      setActiveRallyes(rallyes);
      setSelectionStep('rallye');
      setFetchState('ready');
    } catch (error) {
      console.error('Error loading rallyes:', error);
      Alert.alert(t('common.errorTitle'), t('welcome.error'));
      setFetchState('error');
    }
  };

  const handleBack = async () => {
    if (selectionStep === 'rallye') {
      if (departments.length <= 1) {
        await clearSelectedOrganization();
        setSelectedOrganization(null);
        setSelectedDepartment(null);
        setDepartments([]);
        setActiveRallyes([]);
        setTourModeRallye(null);
        setSelectionStep('organization');
      } else {
        await clearSelectedDepartment();
        setSelectedDepartment(null);
        setActiveRallyes([]);
        setSelectionStep('department');
      }
      return;
    }

    if (selectionStep === 'department') {
      await clearSelectedOrganization();
      setSelectedOrganization(null);
      setSelectedDepartment(null);
      setDepartments([]);
      setActiveRallyes([]);
      setTourModeRallye(null);
      setSelectionStep('organization');
    }
  };

  const handleOrgModalSelect = (item: SelectionItem) => {
    const org = organizations.find((entry) => entry.id === item.id);
    if (!org) return;
    setShowOrgModal(false);
    void handleOrganizationSelect(org);
  };

  const handleDeptModalSelect = (item: SelectionItem) => {
    const dept = departments.find((entry) => entry.id === item.id);
    if (!dept) return;
    setShowDeptModal(false);
    void handleDepartmentSelect(dept);
  };

  const stateBackground = isDarkMode
    ? Colors.darkMode.background
    : Colors.lightMode.background;
  const compactCardStyle = globalStyles.welcomeStyles.compactCard;

  const LoadingContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.offline,
        {
          backgroundColor: stateBackground,
        },
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

  const StateContent = ({ message }: { message: string }) => (
    <View
      style={[
        globalStyles.welcomeStyles.offline,
        {
          backgroundColor: stateBackground,
        },
      ]}
    >
      <ThemedText
        variant="body"
        style={[globalStyles.welcomeStyles.text, s.muted, { marginBottom: 20 }]}
      >
        {message}
      </ThemedText>
      <UIButton icon="rotate" onPress={() => void initializeSelection()}>
        {t('common.refresh')}
      </UIButton>
    </View>
  );

  const NoRallyesCard = () => (
    <Card
      containerStyle={compactCardStyle}
      title={t('welcome.noRallyes.title')}
      description={t('welcome.noRallyes.description')}
      icon="info.circle"
    />
  );

  const OrganizationContent = () => (
    <Card
      containerStyle={compactCardStyle}
      title={t('welcome.selectOrganization.title')}
      description={t('welcome.selectOrganization.description')}
      icon="building.2"
      layout="vertical"
    >
      <UIButton onPress={() => setShowOrgModal(true)}>
        {t('common.select')}
      </UIButton>
    </Card>
  );

  const DepartmentContent = () => (
    <>
      {!hasActiveRallyes && hasTourMode ? <NoRallyesCard /> : null}
      {departments.length > 0 ? (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.selectDepartment.title')}
          description={t('welcome.selectDepartment.description')}
          icon="graduationcap"
          layout="vertical"
        >
          <UIButton onPress={() => setShowDeptModal(true)}>
            {t('common.select')}
          </UIButton>
        </Card>
      ) : null}
      {tourModeRallye ? (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.explore.title')}
          description={t('welcome.explore.description')}
          icon="binoculars"
        >
          <UIButton outline onPress={startTourMode}>
            {t('welcome.explore.start')}
          </UIButton>
        </Card>
      ) : null}
    </>
  );

  const RallyeContent = () => (
    <>
      {selectedDepartment ? (
        <ThemedText
          variant="bodyStrong"
          style={[
            globalStyles.welcomeStyles.text,
            s.muted,
            { marginBottom: 6 },
          ]}
        >
          {selectedDepartment.name}
        </ThemedText>
      ) : null}
      {!hasActiveRallyes && hasTourMode ? <NoRallyesCard /> : null}
      {hasActiveRallyes ? (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.join.title')}
          description={t('welcome.join.description')}
          icon="mappin.and.ellipse"
        >
          <UIButton disabled={joining} onPress={() => setShowRallyeModal(true)}>
            {t('welcome.join.select')}
          </UIButton>
        </Card>
      ) : null}
      {tourModeRallye ? (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.explore.title')}
          description={t('welcome.explore.description')}
          icon="binoculars"
        >
          <UIButton outline onPress={startTourMode}>
            {t('welcome.explore.start')}
          </UIButton>
        </Card>
      ) : null}
    </>
  );

  const renderCurrentStep = () => {
    switch (selectionStep) {
      case 'organization':
        return <OrganizationContent />;
      case 'department':
        return <DepartmentContent />;
      case 'rallye':
        return <RallyeContent />;
      default:
        return <OrganizationContent />;
    }
  };

  const ReadyContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.container,
        {
          backgroundColor: stateBackground,
        },
      ]}
    >
      {resumeAvailable && resumeRallye && resumeTeam ? (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.resume.title')}
          description={t('welcome.resume.details', {
            rallye: resumeRallye.name,
            team: resumeTeam.name,
          })}
          icon="clock"
        >
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <UIButton onPress={() => store$.enabled.set(true)}>
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
      ) : null}
      {renderCurrentStep()}
    </View>
  );

  const headerTitle =
    selectedOrganization?.name != null
      ? t('welcome.organizationTitle', {
          organization: selectedOrganization.name,
        })
      : t('welcome.appTitle');

  return (
    <CollapsibleHeroHeader
      heroImage={require('../assets/images/app/dhbw-campus-header.png')}
      logoImage={require('../assets/images/app/dhbw-logo.png')}
      title={headerTitle}
      showBackButton={selectionStep !== 'organization'}
      onBackPress={selectionStep !== 'organization' ? handleBack : undefined}
    >
      {fetchState === 'loading' && <LoadingContent />}
      {fetchState === 'ready' && <ReadyContent />}
      {fetchState === 'offline' && (
        <StateContent message={t('welcome.offline')} />
      )}
      {fetchState === 'empty' && <StateContent message={t('welcome.empty')} />}
      {fetchState === 'error' && <StateContent message={t('welcome.error')} />}
      <RallyeSelectionModal
        visible={showRallyeModal}
        onClose={() => setShowRallyeModal(false)}
        activeRallyes={activeRallyes}
        onJoin={joinRallye}
        joining={joining}
      />
      <SelectionModal
        visible={showOrgModal}
        onClose={() => setShowOrgModal(false)}
        items={organizations.map((org) => ({ id: org.id, name: org.name }))}
        onSelect={handleOrgModalSelect}
        title={t('welcome.selectOrganization.title')}
        emptyMessage={t('welcome.selectOrganization.empty')}
      />
      <SelectionModal
        visible={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        items={departments.map((dept) => ({ id: dept.id, name: dept.name }))}
        onSelect={handleDeptModalSelect}
        title={t('welcome.selectDepartment.title')}
        emptyMessage={t('welcome.selectDepartment.empty')}
      />
    </CollapsibleHeroHeader>
  );
}
