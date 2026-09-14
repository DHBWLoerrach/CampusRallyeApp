import { Stack } from 'expo-router';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';

export default function InfosStackLayout() {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTitleStyle: { color: palette.text },
        headerTintColor: palette.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: t('infos.title') }} />
      <Stack.Screen name="imprint" options={{ title: t('infos.imprint') }} />
      <Stack.Screen name="about" options={{ title: t('infos.about') }} />
    </Stack>
  );
}
