import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  View,
  AppState,
  AppStateStatus,
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
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import { confirm } from '@/utils/ConfirmAlert';
import {
  setCurrentRallye,
  getOrganizationsWithActiveRallyes,
  getDepartmentsForOrganization,
  getRallyesForDepartment,
  getTourModeRallyeForOrganization,
  getCampusEventsDepartment,
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
import { Organization, Department, Rallye } from '@/types/rallye';
import { Logger } from '@/utils/Logger';

// Types for selection phases
type SelectionStep = 'organization' | 'department' | 'rallye';

export default function Welcome() {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const s = useAppStyles();

  const resumeAvailable = useSelector(() => store$.resumeAvailable.get());
  const resumeRallye = useSelector(() => store$.rallye.get());
  const resumeTeam = useSelector(() => store$.team.get());

  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [online, setOnline] = useState(true);

  // States for hierarchical navigation
  const [selectionStep, setSelectionStep] = useState<SelectionStep>('organization');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tourModeRallye, setTourModeRallye] = useState<Rallye | null>(null);
  const [campusEventsDepartment, setCampusEventsDepartment] = useState<Department | null>(null);

  // Modal states
  const [showRallyeModal, setShowRallyeModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [activeRallyes, setActiveRallyes] = useState<Rallye[]>([]);

  // Auto-Refresh refs
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isInitializedRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const AUTO_REFRESH_INTERVAL = 60000;

  const stateBackground = isDarkMode
    ? Colors.darkMode.background
    : Colors.lightMode.background;
  const compactCardStyle = globalStyles.welcomeStyles.compactCard;
  const organizationCardStyle = globalStyles.welcomeStyles.organizationCard;
  const ctaButtonStyle = {
    backgroundColor: isDarkMode ? Colors.darkMode.surface2 : Colors.lightMode.surface2,
    borderWidth: 1,
    borderColor: isDarkMode ? Colors.darkMode.borderSubtle : Colors.lightMode.borderSubtle,
  };
  const ctaButtonTextStyle = { color: Colors.dhbwRed };

  // Initialization
  useEffect(() => {
    initializeSelection();
  }, []);

  const initializeSelection = async () => {
    setLoading(true);
    try {
      const savedOrg = await getStoredOrganization();
      const savedDept = await getStoredDepartment();

      if (savedOrg) {
        const orgs = await getOrganizationsWithActiveRallyes();
        setOrganizations(orgs);
        setOnline(true);

        const orgStillValid = orgs.find(o => o.id === savedOrg.id);
        if (orgStillValid) {
          setSelectedOrganization(orgStillValid);
          
          const depts = await getDepartmentsForOrganization(orgStillValid.id);
          setDepartments(depts);
          const tourRallye = await getTourModeRallyeForOrganization(orgStillValid.id);
          setTourModeRallye(tourRallye);
          const campusEvents = await getCampusEventsDepartment(orgStillValid);
          setCampusEventsDepartment(campusEvents);

          if (savedDept) {
            const deptStillValid = depts.find(d => d.id === savedDept.id);
            if (deptStillValid) {
              setSelectedDepartment(deptStillValid);
              const rallyes = await getRallyesForDepartment(deptStillValid.id);
              setActiveRallyes(rallyes);
              setSelectionStep('rallye');
            } else {
              await clearSelectedDepartment();
              setSelectionStep('department');
            }
          } else {
            setSelectionStep('department');
          }
        } else {
          await clearSelectedOrganization();
          setSelectionStep('organization');
        }
      } else {
        const orgs = await getOrganizationsWithActiveRallyes();
        setOrganizations(orgs);
        setOnline(true);
        
        // Auto-select if only one organization
        if (orgs.length === 1) {
          Logger.debug('AutoSelect', 'Only one organization available, auto-selecting');
          const singleOrg = orgs[0];
          setSelectedOrganization(singleOrg);
          await storeSelectedOrganization(singleOrg);
          
          const depts = await getDepartmentsForOrganization(singleOrg.id);
          setDepartments(depts);
          const tourRallye = await getTourModeRallyeForOrganization(singleOrg.id);
          setTourModeRallye(tourRallye);
          const campusEvents = await getCampusEventsDepartment(singleOrg);
          setCampusEventsDepartment(campusEvents);
          
          // Auto-select if only one department
          if (depts.length === 1) {
            Logger.debug('AutoSelect', 'Only one department available, auto-selecting');
            const singleDept = depts[0];
            setSelectedDepartment(singleDept);
            await storeSelectedDepartment(singleDept);
            const rallyes = await getRallyesForDepartment(singleDept.id);
            setActiveRallyes(rallyes);
            setSelectionStep('rallye');
          } else {
            setSelectionStep('department');
          }
        } else {
          setSelectionStep('organization');
        }
      }
    } catch (error) {
      Logger.error('Welcome', 'Error initializing selection', error);
      setOnline(false);
      setSelectionStep('organization');
    }
    setLoading(false);
    isInitializedRef.current = true;
  };

  // Auto-refresh logic
  const refreshCurrentData = useCallback(async () => {
    if (loading || !isInitializedRef.current) return;
    if (store$.enabled.get()) return;
    if (appStateRef.current !== 'active') return;
    if (showRallyeModal || showOrgModal || showDeptModal) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (selectionStep === 'organization') {
        const orgs = await getOrganizationsWithActiveRallyes();
        setOrganizations(orgs);
        setOnline(true);
      } else if (selectionStep === 'department' && selectedOrganization) {
        const orgs = await getOrganizationsWithActiveRallyes();
        const orgStillValid = orgs.find(o => o.id === selectedOrganization.id);
        
        if (orgStillValid) {
          const depts = await getDepartmentsForOrganization(selectedOrganization.id);
          setDepartments(depts);
          const tourRallye = await getTourModeRallyeForOrganization(selectedOrganization.id);
          setTourModeRallye(tourRallye);
          const campusEvents = await getCampusEventsDepartment(orgStillValid);
          setCampusEventsDepartment(campusEvents);
          
          if (depts.length === 0 && !tourRallye && !campusEvents) {
            await clearSelectedOrganization();
            setSelectedOrganization(null);
            setOrganizations(orgs);
            setCampusEventsDepartment(null);
            setSelectionStep('organization');
          }
        } else {
          await clearSelectedOrganization();
          setSelectedOrganization(null);
          setOrganizations(orgs);
          setCampusEventsDepartment(null);
          setSelectionStep('organization');
        }
      } else if (selectionStep === 'rallye' && selectedOrganization && selectedDepartment) {
        const depts = await getDepartmentsForOrganization(selectedOrganization.id);
        const deptStillValid = depts.find(d => d.id === selectedDepartment.id);
        
        if (deptStillValid) {
          const rallyes = await getRallyesForDepartment(selectedDepartment.id);
          setActiveRallyes(rallyes);
          const tourRallye = await getTourModeRallyeForOrganization(selectedOrganization.id);
          setTourModeRallye(tourRallye);
          
          if (rallyes.length === 0 && !tourRallye) {
            await clearSelectedDepartment();
            setSelectedDepartment(null);
            setDepartments(depts);
            setSelectionStep('department');
          }
        } else {
          await clearSelectedDepartment();
          setSelectedDepartment(null);
          setDepartments(depts);
          setSelectionStep('department');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      Logger.error('AutoRefresh', 'Error refreshing data', error);
    }
  }, [selectionStep, selectedOrganization, selectedDepartment, loading, showRallyeModal, showOrgModal, showDeptModal]);

  // Auto-refresh setup
  useEffect(() => {
    const initialSyncTimeout = setTimeout(() => {
      if (isInitializedRef.current) {
        refreshCurrentData();
      }
    }, 2000);

    refreshIntervalRef.current = setInterval(() => {
      refreshCurrentData();
    }, AUTO_REFRESH_INTERVAL);

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        refreshCurrentData();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      clearTimeout(initialSyncTimeout);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      appStateSubscription.remove();
    };
  }, [refreshCurrentData]);

  // Handler for organization selection
  const handleOrganizationSelect = async (org: Organization) => {
    setSelectedOrganization(org);
    setLoading(true);
    try {
      await storeSelectedOrganization(org);
      
      const depts = await getDepartmentsForOrganization(org.id);
      setDepartments(depts);
      
      const tourRallye = await getTourModeRallyeForOrganization(org.id);
      setTourModeRallye(tourRallye);
      
      const campusEvents = await getCampusEventsDepartment(org);
      setCampusEventsDepartment(campusEvents);
      
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
    } catch (error) {
      Logger.error('Welcome', 'Error loading departments', error);
      Alert.alert(t('common.errorTitle'), t('welcome.departmentLoadError'));
    }
    setLoading(false);
  };

  // Handler for department selection
  const handleDepartmentSelect = async (dept: Department) => {
    setSelectedDepartment(dept);
    setLoading(true);
    try {
      await storeSelectedDepartment(dept);
      
      const rallyes = await getRallyesForDepartment(dept.id);
      setActiveRallyes(rallyes);
      setSelectionStep('rallye');
    } catch (error) {
      Logger.error('Welcome', 'Error loading rallyes', error);
      Alert.alert(t('common.errorTitle'), t('welcome.rallyeLoadError'));
    }
    setLoading(false);
  };

  // Handler for back navigation
  const handleBack = async () => {
    if (selectionStep === 'rallye') {
      // Always go back to department selection first
      await clearSelectedDepartment();
      setSelectedDepartment(null);
      setActiveRallyes([]);
      setSelectionStep('department');
    } else if (selectionStep === 'department') {
      await clearSelectedOrganization();
      setSelectedOrganization(null);
      setSelectedDepartment(null);
      setDepartments([]);
      setTourModeRallye(null);
      setCampusEventsDepartment(null);
      setSelectionStep('organization');
    }
  };

  // Handler for tour mode
  const handleTourModeSubmit = async () => {
    if (!tourModeRallye) {
      Alert.alert(t('common.errorTitle'), t('welcome.tourModeUnavailable'));
      return;
    }
    store$.team.set(null);
    store$.reset();
    store$.rallye.set(tourModeRallye);
    await setCurrentRallye(tourModeRallye);
    store$.enabled.set(true);
  };

  // Handler for Campus Events selection
  const handleCampusEventsSelect = async () => {
    if (!campusEventsDepartment) return;
    
    setLoading(true);
    try {
      setSelectedDepartment(campusEventsDepartment);
      await storeSelectedDepartment(campusEventsDepartment);
      
      const rallyes = await getRallyesForDepartment(campusEventsDepartment.id);
      setActiveRallyes(rallyes);
      setSelectionStep('rallye');
    } catch (error) {
      Logger.error('Welcome', 'Error loading campus events rallyes', error);
      Alert.alert(t('common.errorTitle'), t('welcome.rallyeLoadError'));
    }
    setLoading(false);
  };

  // Handler for joining a rallye (new API)
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
        Logger.error('Welcome', 'Error rehydrating team after join', rehydrateErr);
        store$.team.set(null);
      }

      store$.enabled.set(true);
      return true;
    } catch (e) {
      Logger.error('Welcome', 'Error joining rallye', e);
      Alert.alert(t('common.errorTitle'), t('welcome.participationStartError'));
      return false;
    } finally {
      setJoining(false);
    }
  };

  // Handler for organization selection from modal
  const handleOrgModalSelect = (item: SelectionItem) => {
    const org = organizations.find(o => o.id === item.id);
    if (org) {
      setShowOrgModal(false);
      handleOrganizationSelect(org);
    }
  };

  // Handler for department selection from modal
  const handleDeptModalSelect = (item: SelectionItem) => {
    const dept = departments.find(d => d.id === item.id);
    if (dept) {
      setShowDeptModal(false);
      handleDepartmentSelect(dept);
    }
  };

  // Loading content
  const LoadingContent = () => (
    <View style={[globalStyles.welcomeStyles.offline, { backgroundColor: stateBackground }]}>
      <ActivityIndicator size="large" color={Colors.dhbwRed} />
      <ThemedText variant="body" style={[globalStyles.welcomeStyles.text, s.muted, { marginTop: 16 }]}>
        {t('common.loading')}
      </ThemedText>
    </View>
  );

  // Offline content
  const OfflineContent = () => (
    <View style={[globalStyles.welcomeStyles.offline, { backgroundColor: stateBackground }]}>
      <ThemedText variant="body" style={[globalStyles.welcomeStyles.text, s.muted, { marginBottom: 20 }]}>
        {t('welcome.offline')}
      </ThemedText>
      <UIButton icon="rotate" onPress={initializeSelection}>
        {t('common.refresh')}
      </UIButton>
    </View>
  );

  // Phase 1: Organization selection
  const OrganizationContent = () => (
    <View style={[globalStyles.welcomeStyles.container, { backgroundColor: stateBackground }]}>
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
            style={[s.muted, { textAlign: 'left', width: '100%', marginBottom: 8 }]}
          >
            {t('welcome.selectLocation.description')}
          </ThemedText>
          {organizations.map(org => (
            <Card
              key={org.id}
              containerStyle={organizationCardStyle}
              title={org.name}
              icon="building.2"
              onPress={() => handleOrganizationSelect(org)}
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

  // Phase 2: Department selection
  const hasDepartmentsWithRallyes = departments.length > 0;
  const hasNoContent = !hasDepartmentsWithRallyes && !tourModeRallye && !campusEventsDepartment;

  const DepartmentContent = () => (
    <View style={[globalStyles.welcomeStyles.container, { backgroundColor: stateBackground }]}>
      {hasDepartmentsWithRallyes && (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.selectDepartment.title')}
          description={t('welcome.selectDepartment.description')}
          icon="graduationcap"
        >
          <UIButton
            onPress={() => setShowDeptModal(true)}
            style={ctaButtonStyle}
            textStyle={ctaButtonTextStyle}
          >
            {t('welcome.selectDepartment.button')}
          </UIButton>
        </Card>
      )}
      {campusEventsDepartment && (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.campusEvents.title')}
          description={t('welcome.campusEvents.description')}
          icon="party.popper"
        >
          <UIButton
            onPress={handleCampusEventsSelect}
            style={ctaButtonStyle}
            textStyle={ctaButtonTextStyle}
          >
            {t('welcome.campusEvents.button')}
          </UIButton>
        </Card>
      )}
      {tourModeRallye && (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.explore.title')}
          description={t('welcome.explore.description')}
          icon="binoculars"
        >
          <UIButton outline onPress={handleTourModeSubmit}>
            {t('welcome.explore.start')}
          </UIButton>
        </Card>
      )}
      {hasNoContent && (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <ThemedText variant="body" style={[s.text, { textAlign: 'center', marginBottom: 16 }]}>
            {t('welcome.noContent')}
          </ThemedText>
          <UIButton icon="arrow.backward" onPress={handleBack}>
            {t('common.back')}
          </UIButton>
        </View>
      )}
    </View>
  );

  // Phase 3: Rallye selection
  const hasActiveRallyes = activeRallyes.length > 0;
  const isCampusEventsSelection = Boolean(
    selectedDepartment && campusEventsDepartment && selectedDepartment.id === campusEventsDepartment.id
  );

  const RallyeContent = () => (
    <View style={[globalStyles.welcomeStyles.container, { backgroundColor: stateBackground }]}>
      {/* Department name display with dividers */}
      {selectedDepartment && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          marginBottom: 16,
          paddingHorizontal: 8,
        }}>
          <View style={{
            flex: 1,
            height: 1,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(92, 105, 113, 0.4)',
          }} />
          <Text style={{
            paddingHorizontal: 12,
            fontSize: 15,
            fontWeight: '500',
            color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray,
          }}>
            {selectedDepartment.name}
          </Text>
          <View style={{
            flex: 1,
            height: 1,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(92, 105, 113, 0.4)',
          }} />
        </View>
      )}

      {/* Resume card */}
      {resumeAvailable && resumeRallye && resumeTeam && (
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

      {/* Join rallye card */}
      {hasActiveRallyes && (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.join.title')}
          description={t('welcome.join.description')}
          icon="mappin.and.ellipse"
        >
          <UIButton
            disabled={joining}
            onPress={() => setShowRallyeModal(true)}
            style={ctaButtonStyle}
            textStyle={ctaButtonTextStyle}
          >
            {t('welcome.join.select')}
          </UIButton>
        </Card>
      )}

      {/* Tour mode card */}
      {tourModeRallye && !isCampusEventsSelection && (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.explore.title')}
          description={t('welcome.explore.description')}
          icon="binoculars"
        >
          <UIButton outline onPress={handleTourModeSubmit}>
            {t('welcome.explore.start')}
          </UIButton>
        </Card>
      )}

      {/* No rallyes available */}
      {!hasActiveRallyes && !tourModeRallye && (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.noRallyes.title')}
          description={t('welcome.noRallyes.description')}
          icon="info.circle"
        />
      )}
    </View>
  );

  // Get header title based on selection
  const getHeaderTitle = () => {
    if (selectedOrganization) {
      return `${selectedOrganization.name} Campus Rallyes`;
    }
    return 'Campus Rallyes';
  };

  // Render current step
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

  return (
    <CollapsibleHeroHeader
      heroImage={require('../assets/images/app/dhbw-campus-header.png')}
      logoImage={require('../assets/images/app/dhbw-logo.png')}
      title={getHeaderTitle()}
      showBackButton={selectionStep !== 'organization'}
      onBackPress={handleBack}
    >
      {loading && <LoadingContent />}
      {!loading && online && renderCurrentStep()}
      {!loading && !online && <OfflineContent />}

      <RallyeSelectionModal
        visible={showRallyeModal}
        onClose={() => setShowRallyeModal(false)}
        activeRallyes={activeRallyes as RallyeRow[]}
        onJoin={joinRallye}
        joining={joining}
      />
      <SelectionModal
        visible={showOrgModal}
        onClose={() => setShowOrgModal(false)}
        items={organizations.map(org => ({ id: org.id, name: org.name }))}
        onSelect={handleOrgModalSelect}
        title={t('welcome.selectLocation.modalTitle')}
        emptyMessage={t('welcome.selectLocation.empty')}
      />
      <SelectionModal
        visible={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        items={departments.map(dept => ({ id: dept.id, name: dept.name }))}
        onSelect={handleDeptModalSelect}
        title={t('welcome.selectDepartment.modalTitle')}
        emptyMessage={t('welcome.selectDepartment.empty')}
      />
    </CollapsibleHeroHeader>
  );
}
