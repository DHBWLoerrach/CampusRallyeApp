import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import { store$ } from '@/services/storage/Store';
import { getActiveRallyes, setCurrentRallye } from '@/services/storage/rallyeStorage';
import UIButton from '@/ui/UIButton';
import Card from '@/ui/Card';
import { globalStyles } from '@/utils/GlobalStyles';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';

interface Rally {
  id: string;
  name: string;
  description?: string;
  tour_mode: boolean;
}

const ExploreScreen = observer(function ExploreScreen() {
  const [loading, setLoading] = useState(false);
  const [rallyes, setRallyes] = useState<Rally[]>([]);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { language } = useLanguage();

  useEffect(() => {
    loadRallyes();
  }, []);

  const loadRallyes = async () => {
    setLoading(true);
    try {
      const activeRallyes = await getActiveRallyes();
      // Also get tour mode rallyes for exploration
      const tourRallyes = await getTourModeRallyes();
      setRallyes([...activeRallyes, ...tourRallyes]);
    } catch (error) {
      console.error('Error loading rallyes:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Rallyes konnten nicht geladen werden.'
          : 'Could not load rallyes.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTourModeRallyes = async (): Promise<Rally[]> => {
    try {
      const { supabase } = await import('@/utils/Supabase');
      const { data, error } = await supabase
        .from('rallye')
        .select('*')
        .eq('tour_mode', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tour mode rallyes:', error);
      return [];
    }
  };

  const handleRallyeSelect = async (rallye: Rally) => {
    try {
      // Set rally in exploration mode
      const explorationRallye = { ...rallye, tour_mode: true };
      store$.rallye.set(explorationRallye);
      store$.team.set(null); // No team needed for exploration
      store$.reset(); // Reset previous state
      await setCurrentRallye(explorationRallye);
      
      // Navigate to exploration questions
      router.push('/explore/questions');
    } catch (error) {
      console.error('Error selecting rallye:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Rallye konnte nicht ausgewählt werden.'
          : 'Could not select rallye.'
      );
    }
  };

  return (
    <View
      style={[
        globalStyles.default?.container || {},
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
    >
      <Text
        style={[
          globalStyles.welcomeStyles?.title || {},
          {
            color: isDarkMode
              ? Colors.darkMode.text
              : Colors.lightMode.text,
            marginBottom: 20,
          },
        ]}
      >
        {language === 'de' ? 'Campus erkunden' : 'Explore Campus'}
      </Text>
      
      <Text
        style={[
          globalStyles.default?.text || {},
          {
            color: isDarkMode
              ? Colors.darkMode.text
              : Colors.lightMode.text,
            marginBottom: 20,
            textAlign: 'center',
          },
        ]}
      >
        {language === 'de'
          ? 'Wähle eine Rallye zum Erkunden aus:'
          : 'Choose a rally to explore:'}
      </Text>

      <ScrollView style={{ flex: 1 }}>
        {rallyes.map((rallye) => (
          <View key={rallye.id} style={{ marginBottom: 10 }}>
            <Card
              title={rallye.name}
              description={rallye.description || ''}
              icon="binoculars"
              onPress={() => handleRallyeSelect(rallye)}
              onShowModal={() => {}}
              onPasswordSubmit={() => {}}
              selectedRallye={null}
            />
          </View>
        ))}
        
        {rallyes.length === 0 && !loading && (
          <Text
            style={[
              globalStyles.default?.text || {},
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
                textAlign: 'center',
                marginTop: 50,
              },
            ]}
          >
            {language === 'de'
              ? 'Keine Rallyes verfügbar.'
              : 'No rallyes available.'}
          </Text>
        )}
      </ScrollView>

      <UIButton 
        icon="arrow-left" 
        onPress={() => router.replace('/')}
        disabled={loading}
        color={Colors.dhbwRed}
      >
        {language === 'de' ? 'Zurück' : 'Back'}
      </UIButton>
    </View>
  );
});

export default ExploreScreen;