import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  TouchableOpacity,
  AppState,
  AppStateStatus,
} from 'react-native';
import { supabase } from '@/utils/Supabase';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { IconSymbol } from '@/components/ui/IconSymbol';
import UIButton from '@/components/ui/UIButton';
import Card from '@/components/ui/Card';
import RallyeSelectionModal from '@/components/ui/RallyeSelectionModal';
import SelectionModal, { SelectionItem } from '@/components/ui/SelectionModal';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import { store$ } from '@/services/storage/Store';
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
} from '@/services/storage/rallyeStorage';
import {
  getCurrentTeam,
  teamExists,
  clearCurrentTeam,
} from '@/services/storage/teamStorage';
import { Organization, Department, Rallye } from '@/types/rallye';

// Typen für die Auswahl-Phasen
type SelectionStep = 'organization' | 'department' | 'rallye';

// TODO: Fix types
const handlePasswordSubmit = async (password: string, selectedRallye: any) => {
  try {
    if (password === selectedRallye.password) {
      // Set selected rallye and enable tabs
      store$.rallye.set(selectedRallye);

      // Rehydrate previously created team for this rallye (if any)
      try {
        const existingTeam = await getCurrentTeam(selectedRallye.id);
        if (existingTeam) {
          const exists = await teamExists(selectedRallye.id, existingTeam.id);
          if (exists) {
            store$.team.set(existingTeam);
          } else {
            // Clean up stale local reference
            await clearCurrentTeam(selectedRallye.id);
            store$.team.set(null);
          }
        } else {
          store$.team.set(null);
        }
      } catch (rehydrateErr) {
        console.error('Error rehydrating team after password submit:', rehydrateErr);
        // Fall back to no team; UI will handle setup if needed
        store$.team.set(null);
      }

      store$.enabled.set(true);
    } else {
      Alert.alert(
        'Falsches Passwort',
        'Bitte geben Sie das richtige Passwort ein.'
      );
    }
  } catch (error) {
    console.error('Fehler beim Überprüfen des Passworts:', error);
    Alert.alert('Fehler', 'Es ist ein Fehler aufgetreten.');
  }
};

const handleNoPasswordSubmit = async (tourRallye: Rallye) => {
  if (tourRallye) {
    store$.team.set(null);
    store$.reset();
    store$.rallye.set(tourRallye);
    await setCurrentRallye(tourRallye);
    store$.enabled.set(true);
  } else {
    Alert.alert('Fehler', 'Kein Tour Mode Rallye verfügbar.');
  }
};

export default function Welcome() {
  const { isDarkMode } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);

  // Neue States für hierarchische Navigation
  const [selectionStep, setSelectionStep] = useState<SelectionStep>('organization');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tourModeRallye, setTourModeRallye] = useState<Rallye | null>(null);

  // Bestehende States
  const [showRallyeModal, setShowRallyeModal] = useState(false);
  const [activeRallyes, setActiveRallyes] = useState<Rallye[]>([]);
  const [selectedRallye, setSelectedRallye] = useState<Rallye | null>(null);

  // Auto-Refresh: Refs für Interval und App-State
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isInitializedRef = useRef<boolean>(false);
  const AUTO_REFRESH_INTERVAL = 20000; // 20 Sekunden

  // Initialisierung: Lade gespeicherte Auswahl und Organisationen beim Start
  useEffect(() => {
    initializeSelection();
  }, []);

  const initializeSelection = async () => {
    setLoading(true);
    try {
      // Lade gespeicherte Auswahl
      const savedOrg = await getStoredOrganization();
      const savedDept = await getStoredDepartment();

      if (savedOrg) {
        // Organisation war gespeichert - prüfe ob sie noch existiert/aktiv ist
        const orgs = await getOrganizationsWithActiveRallyes();
        setOrganizations(orgs);
        setOnline(true);

        const orgStillValid = orgs.find(o => o.id === savedOrg.id);
        if (orgStillValid) {
          setSelectedOrganization(orgStillValid);
          
          // Lade Departments und Tour-Mode für diese Organisation
          const depts = await getDepartmentsForOrganization(orgStillValid.id);
          setDepartments(depts);
          const tourRallye = await getTourModeRallyeForOrganization(orgStillValid.id);
          setTourModeRallye(tourRallye);

          if (savedDept) {
            // Department war auch gespeichert - prüfe ob es noch existiert/aktiv ist
            const deptStillValid = depts.find(d => d.id === savedDept.id);
            if (deptStillValid) {
              setSelectedDepartment(deptStillValid);
              const rallyes = await getRallyesForDepartment(deptStillValid.id);
              setActiveRallyes(rallyes);
              setSelectionStep('rallye');
            } else {
              // Department nicht mehr gültig - lösche aus Storage
              await clearSelectedDepartment();
              setSelectionStep('department');
            }
          } else {
            setSelectionStep('department');
          }
        } else {
          // Organisation nicht mehr gültig - lösche aus Storage
          await clearSelectedOrganization();
          setSelectionStep('organization');
        }
      } else {
        // Keine gespeicherte Auswahl - lade Organisationen
        const orgs = await getOrganizationsWithActiveRallyes();
        setOrganizations(orgs);
        setOnline(true);
        
        // Auto-Selection: Wenn nur eine Organisation verfügbar, automatisch auswählen
        if (orgs.length === 1) {
          console.log('[Auto-Select] Nur eine Organisation verfügbar, wähle automatisch aus');
          const singleOrg = orgs[0];
          setSelectedOrganization(singleOrg);
          await storeSelectedOrganization(singleOrg);
          
          // Lade Departments und Tour-Mode für diese Organisation
          const depts = await getDepartmentsForOrganization(singleOrg.id);
          setDepartments(depts);
          const tourRallye = await getTourModeRallyeForOrganization(singleOrg.id);
          setTourModeRallye(tourRallye);
          
          // Auto-Selection: Wenn nur ein Department verfügbar, automatisch auswählen
          if (depts.length === 1) {
            console.log('[Auto-Select] Nur ein Department verfügbar, wähle automatisch aus');
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
      console.error('Error initializing selection:', error);
      setOnline(false);
      setSelectionStep('organization');
    }
    setLoading(false);
    
    // Markiere Initialisierung als abgeschlossen für Auto-Refresh
    isInitializedRef.current = true;
    console.log('[Init] Initialisierung abgeschlossen, Auto-Refresh aktiviert');
  };

  // Auto-Refresh: Aktualisiert Daten basierend auf aktuellem Schritt
  const refreshCurrentData = useCallback(async () => {
    // Nicht refreshen während des Ladens oder vor Initialisierung
    if (loading || !isInitializedRef.current) return;

    console.log('[Auto-Refresh] Aktualisiere Daten für Schritt:', selectionStep);

    try {
      if (selectionStep === 'organization') {
        // Aktualisiere Organisationsliste
        const orgs = await getOrganizationsWithActiveRallyes();
        setOrganizations(orgs);
        setOnline(true);
      } else if (selectionStep === 'department' && selectedOrganization) {
        // Aktualisiere Departments und prüfe ob Organisation noch gültig
        const orgs = await getOrganizationsWithActiveRallyes();
        const orgStillValid = orgs.find(o => o.id === selectedOrganization.id);
        
        if (orgStillValid) {
          const depts = await getDepartmentsForOrganization(selectedOrganization.id);
          setDepartments(depts);
          const tourRallye = await getTourModeRallyeForOrganization(selectedOrganization.id);
          setTourModeRallye(tourRallye);
          
          // Falls keine Departments mehr und kein Tour-Mode → zurück zur Org-Auswahl
          if (depts.length === 0 && !tourRallye) {
            console.log('[Auto-Refresh] Organisation hat keine aktiven Inhalte mehr, zurück zur Auswahl');
            await clearSelectedOrganization();
            setSelectedOrganization(null);
            setOrganizations(orgs);
            setSelectionStep('organization');
          }
        } else {
          // Organisation nicht mehr gültig
          console.log('[Auto-Refresh] Organisation nicht mehr gültig, zurück zur Auswahl');
          await clearSelectedOrganization();
          setSelectedOrganization(null);
          setOrganizations(orgs);
          setSelectionStep('organization');
        }
      } else if (selectionStep === 'rallye' && selectedOrganization && selectedDepartment) {
        // Aktualisiere Rallyes und prüfe ob Department noch gültig
        const depts = await getDepartmentsForOrganization(selectedOrganization.id);
        const deptStillValid = depts.find(d => d.id === selectedDepartment.id);
        
        if (deptStillValid) {
          const rallyes = await getRallyesForDepartment(selectedDepartment.id);
          setActiveRallyes(rallyes);
          const tourRallye = await getTourModeRallyeForOrganization(selectedOrganization.id);
          setTourModeRallye(tourRallye);
          
          // Falls keine Rallyes mehr und kein Tour-Mode → zurück zur Department-Auswahl
          if (rallyes.length === 0 && !tourRallye) {
            console.log('[Auto-Refresh] Department hat keine aktiven Rallyes mehr, zurück zur Auswahl');
            await clearSelectedDepartment();
            setSelectedDepartment(null);
            setDepartments(depts);
            setSelectionStep('department');
          }
        } else {
          // Department nicht mehr gültig → zurück zur Department-Auswahl
          console.log('[Auto-Refresh] Department nicht mehr gültig, zurück zur Auswahl');
          await clearSelectedDepartment();
          setSelectedDepartment(null);
          setDepartments(depts);
          setSelectionStep('department');
        }
      }
    } catch (error) {
      console.error('[Auto-Refresh] Fehler beim Aktualisieren:', error);
    }
  }, [selectionStep, selectedOrganization, selectedDepartment, loading]);

  // Auto-Refresh: Setup und Cleanup des Intervals
  useEffect(() => {
    // Initialer Sync nach kurzer Verzögerung (nach Initialisierung)
    const initialSyncTimeout = setTimeout(() => {
      if (isInitializedRef.current) {
        console.log('[Auto-Refresh] Initialer Sync nach App-Start');
        refreshCurrentData();
      }
    }, 2000); // 2 Sekunden nach Mount für initialen Sync

    // Starte Auto-Refresh Interval
    refreshIntervalRef.current = setInterval(() => {
      refreshCurrentData();
    }, AUTO_REFRESH_INTERVAL);

    // App-State Listener: Sync wenn App aus Hintergrund kommt
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App kommt in den Vordergrund → sofort refreshen
        console.log('[Auto-Refresh] App aus Hintergrund aktiviert, führe Sync durch');
        refreshCurrentData();
      }
      appStateRef.current = nextAppState;
    });

    // Cleanup
    return () => {
      clearTimeout(initialSyncTimeout);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      appStateSubscription.remove();
    };
  }, [refreshCurrentData]);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const orgs = await getOrganizationsWithActiveRallyes();
      setOrganizations(orgs);
      setOnline(orgs.length > 0 || true);
    } catch (error) {
      console.error('Error loading organizations:', error);
      setOnline(false);
    }
    setLoading(false);
  };

  // Handler für Organisation-Auswahl
  const handleOrganizationSelect = async (org: Organization) => {
    setSelectedOrganization(org);
    setLoading(true);
    try {
      // Speichere Auswahl persistent
      await storeSelectedOrganization(org);
      
      const depts = await getDepartmentsForOrganization(org.id);
      setDepartments(depts);
      
      // Lade Tour-Mode Rallye für diese Organisation
      const tourRallye = await getTourModeRallyeForOrganization(org.id);
      setTourModeRallye(tourRallye);
      
      // Auto-Selection: Wenn nur ein Department verfügbar, automatisch auswählen
      if (depts.length === 1) {
        console.log('[Auto-Select] Nur ein Department verfügbar, wähle automatisch aus');
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
      console.error('Error loading departments:', error);
      Alert.alert('Fehler', 'Departments konnten nicht geladen werden.');
    }
    setLoading(false);
  };

  // Handler für Department-Auswahl
  const handleDepartmentSelect = async (dept: Department) => {
    setSelectedDepartment(dept);
    setLoading(true);
    try {
      // Speichere Auswahl persistent
      await storeSelectedDepartment(dept);
      
      const rallyes = await getRallyesForDepartment(dept.id);
      setActiveRallyes(rallyes);
      setSelectionStep('rallye');
    } catch (error) {
      console.error('Error loading rallyes:', error);
      Alert.alert('Fehler', 'Rallyes konnten nicht geladen werden.');
    }
    setLoading(false);
  };

  // Handler für Zurück-Navigation
  const handleBack = async () => {
    if (selectionStep === 'rallye') {
      // Prüfe ob nur ein Department vorhanden ist (Softlock-Vermeidung)
      // Wenn ja, springe direkt zur Organisations-Auswahl
      if (departments.length <= 1) {
        console.log('[Navigation] Nur ein Department vorhanden, springe direkt zur Organisations-Auswahl');
        // Lösche Organisation-Auswahl aus Storage (löscht auch Department)
        await clearSelectedOrganization();
        setSelectionStep('organization');
        setSelectedOrganization(null);
        setSelectedDepartment(null);
        setDepartments([]);
        setActiveRallyes([]);
        setTourModeRallye(null);
      } else {
        // Normale Navigation: Zurück zur Department-Auswahl
        await clearSelectedDepartment();
        setSelectionStep('department');
        setSelectedDepartment(null);
        setActiveRallyes([]);
      }
    } else if (selectionStep === 'department') {
      // Lösche Organisation-Auswahl aus Storage (löscht auch Department)
      await clearSelectedOrganization();
      setSelectionStep('organization');
      setSelectedOrganization(null);
      setDepartments([]);
      setTourModeRallye(null);
    }
  };

  // Handler für Tour-Mode (angepasst für Organisation)
  const handleTourModeSubmit = async () => {
    if (!tourModeRallye) {
      Alert.alert('Fehler', 'Kein Tour Mode für diesen Standort verfügbar.');
      return;
    }
    store$.team.set(null);
    store$.reset();
    store$.rallye.set(tourModeRallye);
    await setCurrentRallye(tourModeRallye);
    store$.enabled.set(true);
  };

  // Modal States für Organisations- und Department-Auswahl
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const handleRallyeSelect = async (rallye: any) => {
    setSelectedRallye(rallye as Rallye);
    await setCurrentRallye(rallye);
    setShowRallyeModal(false);
  };

  // Handler für Organisation-Auswahl aus Modal
  const handleOrgModalSelect = (item: SelectionItem) => {
    const org = organizations.find(o => o.id === item.id);
    if (org) {
      setShowOrgModal(false);
      handleOrganizationSelect(org);
    }
  };

  // Handler für Department-Auswahl aus Modal
  const handleDeptModalSelect = (item: SelectionItem) => {
    const dept = departments.find(d => d.id === item.id);
    if (dept) {
      setShowDeptModal(false);
      handleDepartmentSelect(dept);
    }
  };

  const OfflineContent = ({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) => (
    <View
      style={[
        globalStyles.welcomeStyles.offline,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
    >
      <Text
        style={[
          globalStyles.welcomeStyles.text,
          { marginBottom: 20 },
          {
            color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
          },
        ]}
      >
        {language === 'de' ? 'Du bist offline…' : 'You are offline…'}
      </Text>
      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        {language === 'de' ? 'Aktualisieren' : 'Refresh'}
      </UIButton>
    </View>
  );

  // Phase 1: Organisations-Auswahl
  const OrganizationContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
    >
      <Card
        title={
          language === 'de'
            ? 'Standort auswählen'
            : 'Select Location'
        }
        description={
          language === 'de'
            ? 'Wähle deinen Standort aus, um verfügbare Rallyes zu sehen'
            : 'Select your location to see available rallyes'
        }
        icon="building.2"
        onShowModal={() => setShowOrgModal(true)}
        onPasswordSubmit={() => {}}
      />
    </View>
  );

  // Phase 2: Department-Auswahl
  // Department-Karte nur anzeigen wenn es Departments mit aktiven Rallyes gibt
  const hasDepartmentsWithRallyes = departments.length > 0;

  const DepartmentContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
    >
      {hasDepartmentsWithRallyes && (
        <Card
          title={
            language === 'de'
              ? 'Studiengang auswählen'
              : 'Select Department'
          }
          description={
            language === 'de'
              ? 'Wähle deinen Studiengang aus, um an einer Rallye teilzunehmen'
              : 'Select your department to join a rallye'
          }
          icon="graduationcap"
          onShowModal={() => setShowDeptModal(true)}
          onPasswordSubmit={() => {}}
        />
      )}
      {tourModeRallye && (
        <Card
          title={language === 'de' ? 'Campus-Gelände erkunden' : 'Explore Campus'}
          description={
            language === 'de'
              ? 'Erkunde den Campus in deinem eigenen Tempo ohne Zeitdruck'
              : 'Explore the campus at your own pace without time pressure'
          }
          icon="binoculars"
          onPress={handleTourModeSubmit}
          onPasswordSubmit={() => {}}
        />
      )}
    </View>
  );

  // Phase 3: Rallye-Auswahl
  const RallyeContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
    >
      {/* Department-Name Anzeige */}
      {selectedDepartment && (
        <Text
          style={{
            textAlign: 'center',
            fontSize: 16,
            fontWeight: '500',
            marginBottom: 16,
            color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
          }}
        >
          {selectedDepartment.name}
        </Text>
      )}
      <Card
        title={
          language === 'de'
            ? 'An Campus Rallye teilnehmen'
            : 'Join Campus Rallye'
        }
        description={
          language === 'de'
            ? 'Nimm an einer geführten Rallye teil und entdecke den Campus mit deinem Team'
            : 'Join a guided rally and explore the campus with your team'
        }
        icon="mappin.and.ellipse"
        onShowModal={() => {
          setShowRallyeModal(true);
        }}
        selectedRallye={selectedRallye}
        onPasswordSubmit={(password: string) => {
          if (!selectedRallye) {
            Alert.alert(
              language === 'de' ? 'Fehler' : 'Error',
              language === 'de'
                ? 'Bitte wähle zuerst eine Rallye aus.'
                : 'Please select a rally first.'
            );
            return;
          }
          handlePasswordSubmit(password, selectedRallye);
        }}
      />
      {tourModeRallye && (
        <Card
          title={language === 'de' ? 'Campus-Gelände erkunden' : 'Explore Campus'}
          description={
            language === 'de'
              ? 'Erkunde den Campus in deinem eigenen Tempo ohne Zeitdruck'
              : 'Explore the campus at your own pace without time pressure'
          }
          icon="binoculars"
          onPress={handleTourModeSubmit}
          onPasswordSubmit={() => {}}
        />
      )}
    </View>
  );

  // Dynamischer Titel basierend auf ausgewählter Organisation
  const getHeaderTitle = () => {
    if (selectedOrganization) {
      return `${selectedOrganization.name} Campus Rallye`;
    }
    return language === 'de' ? 'Campus Rallye' : 'Campus Rallye';
  };

  // Render des aktuellen Schritts
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View
        style={[
          globalStyles.welcomeStyles.container,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        <View style={{ position: 'relative' }}>
          <Image
            style={globalStyles.welcomeStyles.headerImage}
            source={require('../assets/images/app/dhbw-campus-header.png')}
          />

          {/* Sprach-Toggle (Links) */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, left: 13 }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            onPress={toggleLanguage}
          >
            <IconSymbol
              name="globe"
              size={24}
              color={isDarkMode ? Colors.lightMode.text : Colors.darkMode.text}
            />
          </TouchableOpacity>

          {/* Zurück-Button (Rechts) - nur sichtbar wenn nicht in Phase 1 */}
          {selectionStep !== 'organization' && (
            <TouchableOpacity
              style={{ position: 'absolute', top: 40, right: 13 }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={handleBack}
            >
              <IconSymbol
                name="arrow.backward"
                size={24}
                color={isDarkMode ? Colors.lightMode.text : Colors.darkMode.text}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={globalStyles.welcomeStyles.header}>
          <Text
            style={[
              globalStyles.welcomeStyles.text,
              globalStyles.welcomeStyles.title,
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
              },
            ]}
          >
            {getHeaderTitle()}
          </Text>
          <Image
            style={globalStyles.welcomeStyles.logo}
            source={require('../assets/images/app/dhbw-logo.png')}
          />
        </View>
        <View
          style={[
            globalStyles.welcomeStyles.content,
            {
              backgroundColor: isDarkMode
                ? Colors.darkMode.background
                : Colors.lightMode.background,
            },
          ]}
        >
          {loading && (
            <View>
              <ActivityIndicator size="large" color={Colors.dhbwRed} />
            </View>
          )}
          {online && !loading && renderCurrentStep()}
          {!online && !loading && (
            <OfflineContent onRefresh={loadOrganizations} loading={loading} />
          )}
        </View>
      </View>
      <RallyeSelectionModal
        visible={showRallyeModal}
        onClose={() => setShowRallyeModal(false)}
        activeRallyes={activeRallyes as any}
        onSelect={handleRallyeSelect}
      />
      <SelectionModal
        visible={showOrgModal}
        onClose={() => setShowOrgModal(false)}
        items={organizations.map(org => ({ id: org.id, name: org.name }))}
        onSelect={handleOrgModalSelect}
        title={language === 'de' ? 'Standort auswählen' : 'Select Location'}
        emptyMessage={language === 'de' ? 'Keine Standorte verfügbar' : 'No locations available'}
      />
      <SelectionModal
        visible={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        items={departments.map(dept => ({ id: dept.id, name: dept.name }))}
        onSelect={handleDeptModalSelect}
        title={language === 'de' ? 'Studiengang auswählen' : 'Select Department'}
        emptyMessage={language === 'de' ? 'Keine Studiengänge verfügbar' : 'No departments available'}
      />
    </KeyboardAvoidingView>
  );
}
