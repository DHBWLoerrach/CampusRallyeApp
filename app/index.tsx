import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
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
import { store$ } from '@/services/storage/Store';
import {
  getActiveRallyes,
  setCurrentRallye,
  getTourModeRallye,
} from '@/services/storage/rallyeStorage';

// TODO: Fix types
const handlePasswordSubmit = async (password: string, selectedRallye: any) => {
  try {
    if (password === selectedRallye.password) {
      store$.rallye.set(selectedRallye);
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

const handleNoPasswordSubmit = async () => {
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

  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);

  const [showRallyeModal, setShowRallyeModal] = useState(false);
  const [activeRallyes, setActiveRallyes] = useState([]);
  const [selectedRallye, setSelectedRallye] = useState(null);

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

  const handleRallyeSelect = async (rallye) => {
    setSelectedRallye(rallye);
    await setCurrentRallye(rallye);
    setShowRallyeModal(false);
  };

  const OfflineContent = ({ loading, onRefresh }) => (
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
        onPasswordSubmit={(password) => {
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
      <Card
        title={language === 'de' ? 'Campus-Gelände erkunden' : 'Explore Campus'}
        description={
          language === 'de'
            ? 'Erkunde den Campus in deinem eigenen Tempo ohne Zeitdruck'
            : 'Explore the campus at your own pace without time pressure'
        }
        icon="binoculars"
        onPress={handleNoPasswordSubmit}
      />
    </View>
  );

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
            {language === 'de'
              ? 'DHBW Lörrach Campus Rallye'
              : 'DHBW Lörrach Campus Rallye'}
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
          {online && !loading && <OnlineContent />}
          {!online && !loading && (
            <OfflineContent onRefresh={onRefresh} loading={loading} />
          )}
        </View>
      </View>
      <RallyeSelectionModal
        visible={showRallyeModal}
        onClose={() => setShowRallyeModal(false)}
        activeRallyes={activeRallyes}
        onSelect={handleRallyeSelect}
      />
    </KeyboardAvoidingView>
  );
}
