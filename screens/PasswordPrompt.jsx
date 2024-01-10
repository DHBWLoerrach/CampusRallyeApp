import { useState } from 'react';
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  Text,
  TextInput,
  Image
} from 'react-native';

import Colors from '../utils/Colors';

// TODO basically same code as GroupPrompt
export default function PasswordPrompt({ onPasswordSubmit, onContinueWithoutRallye }) {
  const [password, setPassword] = useState('');
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.upperHalf}>
        <Text style={styles.text}>Nimmst du an einer Rallye teil ?</Text>
        <Text style={[styles.passwordLabel, styles.text]}>Passwort eingeben:</Text>
        <TextInput
          style={styles.passwordInput}
          secureTextEntry={true}
          onChangeText={setPassword}
          value={password}
        />
        <View style={styles.buttonContainer}>
          <Button
            title="Anmelden"
            onPress={() => onPasswordSubmit(password)}
            color={'grey'}
          />
        </View>
      </View>
      <View style={styles.lowerHalf}>
        <View style={styles.separator}>
          <View style={styles.line} />
          <Image source={require('../assets/favicon.png')} style={styles.image} />
          <View style={styles.line} />
        </View>
        <View style={styles.lowerHalfContainer}>
          <Text style={styles.text}>
            Möchtest du das Campus Gelände ohne Rally erforschen ?
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Erkunden ohne Rallye"
              onPress={() => onContinueWithoutRallye()}
              color={'grey'}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    color: Colors.dhbwGray,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
  },
  upperHalf: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:80,
    marginBottom: 30
  },
  lowerHalf: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  passwordLabel: {
    marginBottom: 16,
  },
  passwordInput: {
    width: '80%',
    height: 48,
    borderWidth: 1,
    borderColor: Colors.dhbwGray,
    margin: 6,
    borderRadius: 5,
    marginBottom: 20,
    padding: 10,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dhbwGray,
  },
  lowerHalfContainer: {
    justifyContent: 'center',
    width: '100%',
    marginTop: 30
  },
  buttonContainer: {
    margin: 6,
    padding: 5,
    borderRadius: 5,
    alignSelf: 'center'
  },
  button: {
    margin: 20, 
  },
  image: {
    width: 100, 
    height: 100,
    marginHorizontal: 10,
  },
});