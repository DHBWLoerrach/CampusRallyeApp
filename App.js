import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { supabase } from './utils/supabase';
import MainNavigator from './MainNavigator';
import PasswordPrompt from './screens/PasswordPrompt';

export default function App() {
  const [enabled, setEnabled] = useState(false);
  const [realPassword, setRealPassword] = useState(null);

  useEffect(() => {
    async function getData() {
      let { data: realPassword } = await supabase
        .from('Rallye')
        .select('password');
      setRealPassword(realPassword[0].password);
    }
    getData();
  }, []);

  const handlePasswordSubmit = (password) => {
    if (password === realPassword) {
      setEnabled(true);
    } else {
      Alert.alert(
        'Falsches Passwort',
        'Bitte geben Sie das richtige Passwort ein.'
      );
    }
  };

  return (
    <NavigationContainer>
      {enabled ? (
        <MainNavigator />
      ) : (
        <PasswordPrompt onPasswordSubmit={handlePasswordSubmit} />
      )}
    </NavigationContainer>
  );
}
