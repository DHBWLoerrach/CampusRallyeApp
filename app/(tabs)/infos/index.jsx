import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '@/utils/GlobalStyles';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import ThemedView from '@/components/themed/ThemedView';
import ThemedText from '@/components/themed/ThemedText';

export default function Infos() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();

  return (
    <ThemedView variant="background" style={globalStyles.settingsStyles.container}>
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
        <ThemedText style={globalStyles.settingsStyles.tileText}>
          {language === 'de' ? 'Impressum' : 'Imprint'}
        </ThemedText>
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
        <ThemedText style={globalStyles.settingsStyles.tileText}>
          {language === 'de' ? 'Über diese App' : 'About this app'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}
