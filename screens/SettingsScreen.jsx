import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { store$ } from '../utils/Store';
import UIButton from '../ui/UIButton';

export default function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tile}
        onPress={() => navigation.navigate('Impressum')}
      >
        <Text style={styles.tileText}>Impressum</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tile}
        onPress={() => navigation.navigate('Informationen')}
      >
        <Text style={styles.tileText}>Informationen</Text>
      </TouchableOpacity>
      <UIButton
        style={styles.button}
        icon="arrow-left" onPress={() => store$.enabled.set(false)}
      >
        <Text>Zurück zur Anmeldung</Text>
      </UIButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tile: {
    width: '80%',
    height: 100,
    marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'grey',
  },

  tileText: {
    fontSize: 20,
    color: 'grey',
  },

  button: {
    paddingTop: 20,
    marginVertical: 10,
  },
});
