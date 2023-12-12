import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { supabase } from './utils/Supabase';
import MainNavigator from './MainNavigator';
import PasswordPrompt from './screens/PasswordPrompt';
import { useSharedStates } from './utils/SharedStates';
import {deleteData} from'./utils/LocalStorage'

export default function App() {
  const [enabled, setEnabled] = useState(false);
  const [realPassword, setRealPassword] = useState(null);
  const { useRallye, setUseRallye } = useSharedStates();
  const { rallye, setRallye } = useSharedStates();

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
      setUseRallye(true);
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

  const handleNoPasswordSubmit = async ()=>{
    await deleteData('group_key'); 
    setEnabled(true);
    setUseRallye(false);
  }

  return (
    <NavigationContainer>
      {enabled ? (
        <MainNavigator />
      ) : (
        <PasswordPrompt onPasswordSubmit={handlePasswordSubmit} onContinueWithoutRallye={handleNoPasswordSubmit}/>
      )}
    </NavigationContainer>
  );
}
