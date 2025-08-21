import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '@/utils/GlobalStyles';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';

export default function Infos() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
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
        onPress={() => router.push('/infos/imprint')}
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
        onPress={() => router.push('/infos/about')}
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
          {language === 'de' ? 'Über diese App' : 'About this app'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
