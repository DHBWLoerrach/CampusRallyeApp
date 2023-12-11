import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { supabase } from './utils/Supabase';
import MainNavigator from './MainNavigator';
import PasswordPrompt from './screens/PasswordPrompt';
import { useSharedStates } from './utils/SharedStates';

export default function App() {
  const [enabled, setEnabled] = useState(false);
  const [realPassword, setRealPassword] = useState(null);
  const {setRallye,rallye} = useSharedStates();

  useEffect(() => {
    async function getData() {
      let { data: realPassword } = await supabase
        .from('Rallye')
        .select('password');
      setRealPassword(realPassword[0].password);
      console.log(realPassword)
    }
    getData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: rallye } = await supabase
        .from('rallye')
        .select('*')
        .eq('is_active_rallye', true);
      
      setRallye(rallye[0]);
    };
    fetchData();
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
