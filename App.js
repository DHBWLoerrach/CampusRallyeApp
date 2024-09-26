import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { supabase } from './utils/Supabase';
import MainNavigator from './MainNavigator';
import Welcome from './screens/Welcome';
import { useSharedStates } from './utils/SharedStates';

export default function App() {
  const [realPassword, setRealPassword] = useState(null);
  const { setRallye, enabled, setEnabled } = useSharedStates();

  useEffect(() => {
    async function getData() {
      const { data: login } = await supabase
        .from('login')
        .select('password, rallye!inner(id)')
        .eq('rallye.is_active_rallye', true);
      setRealPassword(login[0].password);
    }
    getData();
  }, []);

  const handlePasswordSubmit = async (password) => {
    if (password === realPassword) {
      const { data: rallye } = await supabase
        .from('rallye')
        .select('*')
        .eq('is_active_rallye', true);
      setRallye(rallye[0]);
      setEnabled(true);
    } else {
      Alert.alert(
        'Falsches Passwort',
        'Bitte geben Sie das richtige Passwort ein.'
      );
    }
  };

  const handleNoPasswordSubmit = async () => {
    setEnabled(true);
    setRallye(null);
  };

  return (
    <NavigationContainer>
      {enabled ? (
        <MainNavigator />
      ) : (
        <Welcome
          onPasswordSubmit={handlePasswordSubmit}
          onContinueWithoutRallye={handleNoPasswordSubmit}
        />
      )}
    </NavigationContainer>
  );
}
