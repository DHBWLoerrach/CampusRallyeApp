import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { store$ } from '../services/storage/Store';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/GlobalStyles';

export default function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <View style={globalStyles.settingsStyles.container}>
      <TouchableOpacity
        style={globalStyles.settingsStyles.tile}
        onPress={() => navigation.navigate('Impressum')}
      >
        <Text style={globalStyles.settingsStyles.tileText}>Impressum</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={globalStyles.settingsStyles.tile}
        onPress={() => navigation.navigate('Informationen')}
      >
        <Text style={globalStyles.settingsStyles.tileText}>Informationen</Text>
      </TouchableOpacity>
      
      {/* <UIButton
        style={globalStyles.settingsStyles.button}
        icon="arrow-left" onPress={() => store$.enabled.set(false)}
      >
        <Text>Zurück zur Anmeldung</Text>
      </UIButton> */}
    </View>
  );
}
