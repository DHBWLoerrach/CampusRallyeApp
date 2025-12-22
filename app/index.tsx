import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  View,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/utils/Supabase';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { IconSymbol } from '@/components/ui/IconSymbol';
import UIButton from '@/components/ui/UIButton';
import Card from '@/components/ui/Card';
import RallyeSelectionModal from '@/components/ui/RallyeSelectionModal';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import { ScreenScrollView } from '@/components/ui/Screen';
import { store$ } from '@/services/storage/Store';
import { useSelector } from '@legendapp/state/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from '@/components/themed/ThemedText';
import {
  getActiveRallyes,
  setCurrentRallye,
  getTourModeRallye,
  type RallyeRow,
} from '@/services/storage/rallyeStorage';
import {
  getCurrentTeam,
  teamExists,
  clearCurrentTeam,
} from '@/services/storage/teamStorage';

const startTourMode = async () => {
  const tourRallye = await getTourModeRallye();
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
  const insets = useSafeAreaInsets();

  const resumeAvailable = useSelector(() => store$.resumeAvailable.get());
  const resumeRallye = useSelector(() => store$.rallye.get());
  const resumeTeam = useSelector(() => store$.team.get());

  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [joining, setJoining] = useState(false);

  const [showRallyeModal, setShowRallyeModal] = useState(false);
  const [activeRallyes, setActiveRallyes] = useState<RallyeRow[]>([]);

  useEffect(() => {
    onRefresh();
  }, []);

  const onRefresh = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('rallye')
      .select('*')
      .not('status', 'in', '(inactive,ended)')
      .eq('tour_mode', false);

    if (data) {
      setOnline(true);
    } else {
      setOnline(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const rallyes = await getActiveRallyes();
      setActiveRallyes(rallyes);
    })();
  }, [showRallyeModal]);

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
          if (exists) {
            store$.team.set(existingTeam);
          } else {
            await clearCurrentTeam(rallye.id);
            store$.team.set(null);
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
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Teilnahme konnte nicht gestartet werden.'
          : 'Could not start participation.'
      );
      return false;
    } finally {
      setJoining(false);
    }
  };

  const OfflineContent = ({
    loading,
    onRefresh,
  }: {
    loading: boolean;
    onRefresh: () => void | Promise<void>;
  }) => (
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
      <ThemedText
        variant="body"
        style={[globalStyles.welcomeStyles.text, { marginBottom: 20 }]}
      >
        {language === 'de' ? 'Du bist offline…' : 'You are offline…'}
      </ThemedText>
      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        {language === 'de' ? 'Aktualisieren' : 'Refresh'}
      </UIButton>
    </View>
  );

  const OnlineContent = () => (
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
      {resumeAvailable && resumeRallye && resumeTeam ? (
        <Card
          title={language === 'de' ? 'Rallye fortsetzen' : 'Resume rallye'}
          description={
            language === 'de'
              ? `Rallye: ${resumeRallye.name}\nTeam: ${resumeTeam.name}`
              : `Rallye: ${resumeRallye.name}\nTeam: ${resumeTeam.name}`
          }
          icon="clock"
        >
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <UIButton onPress={() => store$.enabled.set(true)}>
                {language === 'de' ? 'Fortsetzen' : 'Resume'}
              </UIButton>
            </View>
            <View style={{ flex: 1 }}>
              <UIButton
                outline
                color={Colors.dhbwRed}
                onPress={() => {
                  Alert.alert(
                    language === 'de'
                      ? 'Teilnahme löschen'
                      : 'Clear participation',
                    language === 'de'
                      ? 'Möchtest du die gespeicherte Teilnahme wirklich löschen? Die Teamzuordnung auf diesem Gerät wird entfernt.'
                      : 'Do you really want to clear the saved participation? The team assignment on this device will be removed.',
                    [
                      {
                        text: language === 'de' ? 'Abbrechen' : 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: language === 'de' ? 'Löschen' : 'Clear',
                        style: 'destructive',
                        onPress: () => void store$.leaveRallye(),
                      },
                    ]
                  );
                }}
              >
                {language === 'de' ? 'Neu starten' : 'Start over'}
              </UIButton>
            </View>
          </View>
        </Card>
      ) : null}

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
      >
        <UIButton disabled={joining} onPress={() => setShowRallyeModal(true)}>
          {language === 'de' ? 'Rallye auswählen' : 'Select rallye'}
        </UIButton>
      </Card>
      <Card
        title={language === 'de' ? 'Campus-Gelände erkunden' : 'Explore Campus'}
        description={
          language === 'de'
            ? 'Erkunde den Campus in deinem eigenen Tempo ohne Zeitdruck'
            : 'Explore the campus at your own pace without time pressure'
        }
        icon="binoculars"
        onPress={startTourMode}
      />
    </View>
  );

  return (
    <ScreenScrollView
      padding="none"
      edges={['bottom']}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={globalStyles.welcomeStyles.container}
    >
      <View style={{ position: 'relative' }}>
        <Image
          style={globalStyles.welcomeStyles.headerImage}
          source={require('../assets/images/app/dhbw-campus-header.png')}
        />

        <TouchableOpacity
          style={{ position: 'absolute', top: insets.top, left: 13 }}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onPress={toggleLanguage}
        >
          <IconSymbol
            name="globe"
            size={24}
            color={isDarkMode ? Colors.lightMode.text : Colors.darkMode.text}
          />
        </TouchableOpacity>
      </View>
      <View style={globalStyles.welcomeStyles.header}>
        <ThemedText
          variant="subtitle"
          style={[globalStyles.welcomeStyles.text, globalStyles.welcomeStyles.title]}
        >
          {language === 'de'
            ? 'DHBW Lörrach Campus Rallye'
            : 'DHBW Lörrach Campus Rallye'}
        </ThemedText>
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
        {online && !loading && OnlineContent()}
        {!online && !loading && OfflineContent({ onRefresh, loading })}
      </View>
      <RallyeSelectionModal
        visible={showRallyeModal}
        onClose={() => setShowRallyeModal(false)}
        activeRallyes={activeRallyes}
        onJoin={joinRallye}
        joining={joining}
      />
    </ScreenScrollView>
  );
}
