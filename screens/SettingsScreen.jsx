import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useContext } from 'react';
import { store$ } from '../services/storage/Store';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/GlobalStyles';
import { ThemeContext } from '../utils/ThemeContext';
import Colors from '../utils/Colors';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <View style={[
      globalStyles.settingsStyles.container,
      { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
    ]}>
      <TouchableOpacity
        style={[
          globalStyles.settingsStyles.tile,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}
        onPress={() => navigation.navigate('Impressum')}
      >
        <Text style={[
          globalStyles.settingsStyles.tileText,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          Impressum
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          globalStyles.settingsStyles.tile,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}
        onPress={() => navigation.navigate('Informationen')}
      >
        <Text style={[
          globalStyles.settingsStyles.tileText,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          Informationen
        </Text>
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
