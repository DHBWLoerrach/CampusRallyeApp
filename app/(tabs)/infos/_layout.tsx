import { Stack } from 'expo-router';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';

export default function InfosStackLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Infos' }} />
      <Stack.Screen name="imprint" options={{ title: 'Impressum' }} />
      <Stack.Screen name="about" options={{ title: 'Über diese App' }} />
    </Stack>
  );
}
