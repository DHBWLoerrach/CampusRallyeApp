import { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../utils/Colors';
import UIButton from '../ui/UIButton';

export default function Welcome({
  onPasswordSubmit,
  onContinueWithoutRallye,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const PasswordModal = ({ onStart }) => {
    const [password, setPassword] = useState('');
    return (
      <Modal
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => {
            setModalVisible(false);
            setPassword('');
          }}
        >
          <View style={styles.popoverContent}>
            <TextInput
              placeholder="Passwort eingeben"
              secureTextEntry={true}
              style={styles.passwordInput}
              onChangeText={setPassword}
              value={password}
            />
            <Pressable onPress={() => onStart(password)}>
              <FontAwesome
                name="arrow-right"
                size={32}
                color={Colors.dhbwRed}
                marginRight={5}
              />
            </Pressable>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.headerImage}
        source={require('../assets/dhbw-campus-header.png')}
      />
      <View style={styles.header}>
        <Text style={[styles.text, styles.title]}>
          DHBW Lörrach Campus Rallye
        </Text>
        <Image
          style={styles.logo}
          source={require('../assets/dhbw-logo.png')}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.button}>
          <PasswordModal onStart={onPasswordSubmit} />
          <UIButton onPress={() => setModalVisible(true)}>
            An Campus Rallye teilnehmen{'\n'}(Passwort erforderlich)
          </UIButton>
        </View>
        <UIButton onPress={onContinueWithoutRallye}>
          Campus-Gelände erkunden
        </UIButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  headerImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height / 3,
  },
  header: {
    marginTop: 10,
    flexDirection: 'row',
  },
  logo: {
    marginLeft: 20,
    width: 60,
    height: 60,
  },
  text: {
    color: Colors.dhbwGray,
    fontSize: 20,
  },
  title: {
    flex: 1,
    color: Colors.dhbwRed,
    fontWeight: 500,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  button: {
    width: '100%',
    marginVertical: 60,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  popoverContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.dhbwRed,
  },
  passwordInput: {
    height: 50,
    flex: 1,
    paddingHorizontal: 10,
  },
});
