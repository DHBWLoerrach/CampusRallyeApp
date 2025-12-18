import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import Colors from '@/utils/Colors';
import { LanguageProvider } from '@/utils/LanguageContext';
import { createNavigationTheme } from '@/utils/navigationTheme';
import { ThemeContext, themeStore$, ThemeMode } from '@/utils/ThemeContext';

// Keep the native splash screen visible while we load fonts and initialize navigation.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const segments = useSegments(); // ['(tabs)', 'index'] etc.
  const navState = useRootNavigationState(); // ready-check
  // Subscribe reactively to Legend state changes
  const enabled = useSelector(() => store$.enabled.get());
  const hydrated = useSelector(() => store$.hydrated.get());
  const mode = useSelector(() => themeStore$.mode.get());
  const setMode = (next: ThemeMode) => themeStore$.mode.set(next);
  const isDark =
    mode === 'dark' || (mode === 'system' && colorScheme === 'dark');
  const palette = isDark ? Colors.darkMode : Colors.lightMode;

  const isReady = hydrated && !!navState?.key && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  useEffect(() => {
    if (!navState?.key) return;
    const inTabs = segments[0] === '(tabs)';
    if (enabled && !inTabs) router.replace('/(tabs)/rallye');
    if (!enabled && inTabs) router.replace('/');
  }, [enabled, segments, router, navState?.key]);

  if (!isReady) return null;

  const navTheme = createNavigationTheme(isDark, palette);
  return (
    <ThemeProvider value={navTheme}>
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
