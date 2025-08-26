import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from 'expo-router';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { LanguageProvider } from '@/utils/LanguageContext';
import { ThemeContext, themeStore$, ThemeMode } from '@/utils/ThemeContext';

function RootNavigator() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const segments = useSegments(); // ['(tabs)', 'index'] etc.
  const navState = useRootNavigationState(); // ready-check
  // Subscribe reactively to Legend state changes
  const enabled = useSelector(() => store$.enabled.get());
  const mode = useSelector(() => themeStore$.mode.get());
  const setMode = (next: ThemeMode) => themeStore$.mode.set(next);
  const isDark = mode === 'dark' || (mode === 'system' && colorScheme === 'dark');

  useEffect(() => {
    if (!navState?.key) return;
    const inTabs = segments[0] === '(tabs)';
    if (enabled && !inTabs) router.replace('/(tabs)/rallye');
    if (!enabled && inTabs) router.replace('/');
  }, [enabled, segments, router, navState?.key]);

  if (!loaded || !navState?.key) return null;

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <ThemeContext.Provider value={{ isDarkMode: isDark, mode, setMode }}>
        <LanguageProvider>
          <Slot />
        </LanguageProvider>
      </ThemeContext.Provider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootNavigator />;
}
