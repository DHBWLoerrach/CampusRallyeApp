import { Alert } from 'react-native';
import React, { useState, useEffect } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { supabase } from './supabase';

import MainNavigator from './js/screens/MainNavigator';
import PasswordPrompt from './js/screens/PasswordPrompt';
import GroupPrompt from './js/screens/GroupPrompt';

export default function App() {
  const [enabled, setEnabled] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [confirmedGroup, setConfirmedGroup] = useState('');

  const [realpassword, setrealpassword] = useState(null);

  useEffect(() => {
    async function getData() {
      let { data: realpassword } = await supabase
        .from('Rallye')
        .select('password');
      setrealpassword(realpassword[0].password);
    }
    getData();
  }, []);

  const handlePasswordSubmit = (password) => {
    if (password === realpassword) {
      setShowPasswordPrompt(false);
    } else {
      Alert.alert(
        'Falsches Passwort',
        'Bitte geben Sie das richtige Passwort ein.'
      );
    }
  };

  const handleGroupSubmit = (group) => {
    if (group.trim() === '') {
      Alert.alert('Fehler', 'Bitte gebe einen Gruppennamen ein.');
      return;
    }

    Alert.alert(
      'Sicherheitsfrage',
      `Bist du sicher, dass "${group}" dein Gruppenname ist?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Ja, Antwort bestätigen',
          onPress: () => {
            setConfirmedGroup(group);
            setEnabled(true);
          },
        },
      ]
    );
  };

  return (
    <NavigationContainer>
      {enabled ? (
        <MainNavigator confirmedGroup={confirmedGroup} />
      ) : showPasswordPrompt ? (
        <PasswordPrompt onPasswordSubmit={handlePasswordSubmit} />
      ) : (
        <GroupPrompt onGroupSubmit={handleGroupSubmit} />
      )}
    </NavigationContainer>
  );
}
