import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { observer } from '@legendapp/state/react';
import { store$ } from './services/storage/Store';
import { supabase } from './utils/Supabase';
import MainNavigator from './navigation/MainNavigator';
import WelcomeScreen from './screens/WelcomeScreen';

const App = observer(function App() {
  const [realPassword, setRealPassword] = useState(null);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const enabled = store$.enabled.get();

  useEffect(() => {
    onRefresh();
  }, []);

  const onRefresh = async () => {
    setLoading(true);
    //ggf änderungen bei der Supabase///////////////////
    const { data } = await supabase
      .from('rallye')
      .select('id')
      /* .from('login')
      .select('password, rallye!inner(id)')
      .eq('rallye.is_active_rallye', true); */
    if (data) {
      //Temp dummy zum testen
      setRealPassword("123");//data[0].password);
      setOnline(true);
    } else {
      setOnline(false);
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (password, selectedRallye) => {
    try {
      // Passwort direkt aus dem Rallye-Objekt lesen
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

  const handleNoPasswordSubmit = () => {
    store$.rallye.set(null);
    store$.enabled.set(true);
  };

  return (
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
  );
});

export default App;
