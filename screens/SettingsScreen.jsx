import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useContext } from 'react';
import { store$ } from '../services/storage/Store';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/GlobalStyles';
import { ThemeContext } from '../utils/ThemeContext';
import Colors from '../utils/Colors';
import { useLanguage } from '../utils/LanguageContext';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage();

  return (
    <View
      style={[
        globalStyles.settingsStyles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          globalStyles.settingsStyles.tile,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.card,
          },
        ]}
        onPress={() => navigation.navigate('Impressum')}
      >
        <Text
          style={[
            globalStyles.settingsStyles.tileText,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {language === 'de' ? 'Impressum' : 'Imprint'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          globalStyles.settingsStyles.tile,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.card,
          },
        ]}
        onPress={() => navigation.navigate('Informationen')}
      >
        <Text
          style={[
            globalStyles.settingsStyles.tileText,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {language === 'de' ? 'Informationen' : 'Information'}
        </Text>
      </TouchableOpacity>

      <UIButton
        style={globalStyles.settingsStyles.button}
        icon="arrow-left"
        onPress={() => store$.enabled.set(false)}
      >
        {language === 'de' ? 'Zurück zur Anmeldung' : 'Back to registration'}
      </UIButton>
    </View>
  );
}
