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
import { observer } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { LanguageProvider } from '@/utils/LanguageContext';

function RootNavigator() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const segments = useSegments(); // ['(tabs)', 'index'] etc.
  const navState = useRootNavigationState(); // ready-check
  const enabled = store$.enabled.get();

  useEffect(() => {
    if (!navState?.key) return;
    const inTabs = segments[0] === '(tabs)';
    if (enabled && !inTabs) router.replace('/(tabs)');
    if (!enabled && inTabs) router.replace('/');
  }, [enabled, segments, router, navState?.key]);

  if (!loaded || !navState?.key) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LanguageProvider>
        <Slot />
      </LanguageProvider>
    </ThemeProvider>
  );
}

const ObservedRootNavigator = observer(RootNavigator);

export default function RootLayout() {
  return <ObservedRootNavigator />;
}
