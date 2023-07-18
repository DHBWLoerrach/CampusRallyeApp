import { useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// TODO basically same code as PasswordPrompt
export default function GroupPrompt({ onGroupSubmit }) {
  const [group, setGroup] = useState('');

  return (
    <View style={styles.passwordContainer}>
      <Text style={styles.passwordLabel}>
        Wie soll die Gruppe heißen?
      </Text>
      <TextInput
        style={styles.passwordInput}
        value={group}
        onChangeText={setGroup}
        placeholder="Name der Gruppe"
      />
      <Button
        title="Gruppenname senden"
        onPress={() => onGroupSubmit(group)}
        disabled={!group}
      />
    </View>
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
});
