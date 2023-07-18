import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { supabase } from './supabase';

import MainNavigator from './js/screens/MainNavigator';

/* Component to prompt for password input */
function PasswordPrompt({ onPasswordSubmit }) {
  const [password, setPassword] = useState('');

  const handlePasswordSubmit = () => {
    onPasswordSubmit(password);
  };

  return (
    <View style={styles.passwordContainer}>
      <Text style={styles.passwordLabel}>
        Bitte geben Sie das Passwort ein
      </Text>
      <TextInput
        style={styles.passwordInput}
        secureTextEntry={true}
        onChangeText={setPassword}
        value={password}
      />
      <Button title="Weiter" onPress={handlePasswordSubmit} />
    </View>
  );
}

/* main App; uses the defined pages and navigates between them */
export default function App() {
  const [enabled, setEnabled] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [showGroupPrompt, setShowGroupPrompt] = useState(false);
  const [group, setGroup] = useState('');
  const [groupMembers, setGroupMembers] = useState('');
  const [confirmedGroup, setConfirmedGroup] = useState('');
  const [confirmedGroupMembers, setConfirmedGroupMembers] =
    useState('');

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
      setShowGroupPrompt(true);
    } else {
      Alert.alert(
        'Falsches Passwort',
        'Bitte geben Sie das richtige Passwort ein.'
      );
    }
  };

  const handleGroupSubmit = () => {
    if (group.trim() === '') {
      Alert.alert(
        'Fehler',
        'Bitte geben Sie einen Gruppennamen ein.'
      );
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
            setShowGroupPrompt(false);
          },
        },
      ]
    );
  };

  const handleGroupMembersSubmit = () => {
    if (groupMembers.trim() === '') {
      Alert.alert(
        'Fehler',
        'Bitte geben Sie die Namen der Mitglieder ein.'
      );
      return;
    }

    Alert.alert(
      'Sicherheitsfrage',
      `Bist du sicher, dass "${groupMembers}" zusammen eine Gruppe bilden?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Ja, Antwort bestätigen',
          onPress: () => {
            setConfirmedGroupMembers(groupMembers);
            setEnabled(true);
          },
        },
      ]
    );
  };

  return (
    <NavigationContainer>
      {enabled ? (
        <MainNavigator
          confirmedGroup={confirmedGroup}
          confirmedGroupMembers={confirmedGroupMembers}
        />
      ) : showPasswordPrompt ? (
        <PasswordPrompt onPasswordSubmit={handlePasswordSubmit} />
      ) : showGroupPrompt ? (
        <View style={styles.passwordContainer}>
          <Text style={styles.passwordLabel}>
            Bitte geben Sie einen Gruppennamen ein
          </Text>
          <TextInput
            style={styles.passwordInput}
            value={group}
            onChangeText={setGroup}
            placeholder="Gib hier deinen Gruppennamen ein"
          />
          <Button
            title="Name Absenden"
            onPress={handleGroupSubmit}
            disabled={!group}
          />
        </View>
      ) : (
        <View style={styles.passwordContainer}>
          <Text style={styles.passwordLabel}>
            Bitte geben Sie die Namen der Gruppenmitglieder ein
          </Text>
          <TextInput
            style={styles.passwordInput}
            value={groupMembers}
            onChangeText={setGroupMembers}
            placeholder="Gib hier die Mitglieder ein"
          />
          <Button
            title="Namen Absenden"
            onPress={handleGroupMembersSubmit}
            disabled={!groupMembers}
          />
        </View>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  passwordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  passwordLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  passwordInput: {
    width: '80%',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  answerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  answer: {
    fontSize: 16,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
