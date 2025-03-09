import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { observer } from '@legendapp/state/react';
import { store$ } from './services/storage/Store';
import { supabase } from './utils/Supabase';
import { getTourModeRallye, setCurrentRallye } from './services/storage/rallyeStorage';
import MainNavigator from './navigation/MainNavigator';
import WelcomeScreen from './screens/WelcomeScreen';
import { ThemeContext, themeStore$ } from './utils/ThemeContext';
import { LanguageProvider } from './utils/LanguageContext'; // Import LanguageProvider

const App = observer(function App() {
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [tour, setTour] = useState(null);
  const enabled = store$.enabled.get();

  useEffect(() => {
    onRefresh();
  }, []);

  const onRefresh = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('rallye')
      .select('*')
      .eq('is_active', true);
    if (data) {
      setOnline(true);
    } else {
      setOnline(false);
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (password, selectedRallye) => {
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
      console.log(tourRallye);
      store$.team.set(null);
      store$.reset();
      store$.rallye.set(tourRallye);
      await setCurrentRallye(tourRallye);
      store$.enabled.set(true);
    } else {
      Alert.alert("Fehler", "Kein Tour Mode Rallye verfügbar.");
    }
  };

  const toggleDarkMode = () => {
    themeStore$.isDarkMode.set(!themeStore$.isDarkMode.get());
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode: themeStore$.isDarkMode.get(), toggleDarkMode }}>
      <LanguageProvider>
        <NavigationContainer>
          {enabled ? (
            <MainNavigator />
          ) : (
            <WelcomeScreen
              onPasswordSubmit={handlePasswordSubmit}
              onContinueWithoutRallye={handleNoPasswordSubmit}
              networkAvailable={online}
              loading={loading}
              onRefresh={onRefresh}
            />
          )}
        </NavigationContainer>
      </LanguageProvider>
    </ThemeContext.Provider>
  );
});

export default App;
