import { useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// TODO basically same code as GroupPrompt
export default function PasswordPrompt({ onPasswordSubmit }) {
  const [password, setPassword] = useState('');

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
      <Button
        title="Weiter"
        onPress={() => onPasswordSubmit(password)}
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
