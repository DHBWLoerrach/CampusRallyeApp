import { useState } from 'react';
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

// TODO basically same code as GroupPrompt
export default function PasswordPrompt({ onPasswordSubmit }) {
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.passwordContainer}
    >
      <Text style={styles.passwordLabel}>Passwort eingeben:</Text>
      <TextInput
        style={styles.passwordInput}
        secureTextEntry={true}
        onChangeText={setPassword}
        value={password}
      />
      <Button
        title="Anmelden"
        onPress={() => onPasswordSubmit(password)}
      />
    </KeyboardAvoidingView>
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