import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../utils/Colors';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/GlobalStyles';

export default function WelcomeScreen({
  onPasswordSubmit,
  onContinueWithoutRallye,
  networkAvailable,
  loading,
  onRefresh,
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
          style={globalStyles.welcomeStyles.modalOverlay}
          onPress={() => {
            setModalVisible(false);
            setPassword('');
          }}
        >
          <View style={globalStyles.welcomeStyles.popoverContent}>
            <TextInput
              placeholder="Passwort eingeben"
              secureTextEntry={true}
              style={globalStyles.welcomeStyles.passwordInput}
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

  const OnlineContent = () => (
    <>
      <View style={globalStyles.welcomeStyles.button}>
        <PasswordModal onStart={onPasswordSubmit} />
        <UIButton onPress={() => setModalVisible(true)}>
          An Campus Rallye teilnehmen{'\n'}(Passwort erforderlich)
        </UIButton>
      </View>
      <UIButton onPress={onContinueWithoutRallye}>
        Campus-Gelände erkunden
      </UIButton>
    </>
  );

  const OfflineContent = ({ loading, onRefresh }) => (
    <View style={globalStyles.welcomeStyles.offline}>
      <Text style={[globalStyles.welcomeStyles.text, { marginBottom: 20 }]}>
        Du bist offline…
      </Text>
      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        Aktualisieren
      </UIButton>
    </View>
  );

  return (
    <View style={globalStyles.welcomeStyles.container}>
      <Image
        style={globalStyles.welcomeStyles.headerImage}
        source={require('../assets/dhbw-campus-header.png')}
      />
      <View style={globalStyles.welcomeStyles.header}>
        <Text style={[globalStyles.welcomeStyles.text, globalStyles.welcomeStyles.title]}>
          DHBW Lörrach Campus Rallye
        </Text>
        <Image
          style={globalStyles.welcomeStyles.logo}
          source={require('../assets/dhbw-logo.png')}
        />
      </View>
      <View style={globalStyles.welcomeStyles.content}>
        {loading && (
          <View>
            <ActivityIndicator size="large" color={Colors.dhbwRed} />
          </View>
        )}
        {networkAvailable && !loading && <OnlineContent />}
        {!networkAvailable && !loading && (
          <OfflineContent onRefresh={onRefresh} loading={loading} />
        )}
      </View>
    </View>
  );
}
