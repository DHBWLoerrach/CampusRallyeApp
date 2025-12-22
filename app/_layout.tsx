import { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
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
import { LanguageProvider, useLanguage } from '@/utils/LanguageContext';
import { createNavigationTheme } from '@/utils/navigationTheme';
import { ThemeContext, themeStore$, ThemeMode, useTheme } from '@/utils/ThemeContext';
import { useAppStyles } from '@/utils/AppStyles';
import ThemedText from '@/components/themed/ThemedText';
import UIButton from '@/components/ui/UIButton';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Keep the native splash screen visible while we load fonts and initialize navigation.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const s = useAppStyles();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const debugInfo = __DEV__
    ? (() => {
        try {
          const rallye = store$.rallye.get() as any;
          const team = store$.team.get() as any;
          const question = store$.currentQuestion.get() as any;
          return `rallye:${rallye?.id ?? 'n/a'} team:${team?.id ?? 'n/a'} question:${question?.id ?? 'n/a'}`;
        } catch (debugError) {
          console.error('Failed to read debug info:', debugError);
          return 'debug:unavailable';
        }
      })()
    : null;

  const handleReset = () => {
    if (resetting) return;
    setResetting(true);
    void (async () => {
      try {
        await store$.leaveRallye();
      } catch (resetError) {
        console.error('Error during recovery:', resetError);
      } finally {
        onReset();
        router.replace('/');
      }
    })();
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: palette.background,
      }}
    >
      <ThemedText variant="title" style={[s.text, { textAlign: 'center' }]}>
        {t('common.errorTitle')}
      </ThemedText>
      <ThemedText
        variant="body"
        style={[s.muted, { textAlign: 'center', marginTop: 8, marginBottom: 20 }]}
      >
        {t('welcome.error')}
      </ThemedText>
      <UIButton
        icon="arrow-left"
        onPress={handleReset}
        loading={resetting}
        disabled={resetting}
      >
        {t('rallye.backToStart')}
      </UIButton>
      {__DEV__ ? (
        <View style={{ marginTop: 16, width: '100%' }}>
          {debugInfo ? (
            <ThemedText variant="bodySmall" style={[s.muted, { textAlign: 'left' }]}>
              {debugInfo}
            </ThemedText>
          ) : null}
          <ThemedText variant="bodySmall" style={[s.muted, { textAlign: 'left' }]}>
            {error.name}: {error.message}
          </ThemedText>
          {error.stack ? (
            <ThemedText
              variant="bodySmall"
              style={[s.muted, { textAlign: 'left', marginTop: 6 }]}
            >
              {error.stack}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

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

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.dhbwRed} />
      </View>
    );
  }

  const navTheme = createNavigationTheme(isDark, palette);
  return (
    <ThemeProvider value={navTheme}>
      <ThemeContext.Provider value={{ isDarkMode: isDark, mode, setMode }}>
        <LanguageProvider>
          <ErrorBoundary
            onError={(error, info) => {
              console.error('Unhandled app error:', error, info);
            }}
            fallback={({ error, reset }) => (
              <RootErrorFallback error={error} onReset={reset} />
            )}
          >
            <Slot />
          </ErrorBoundary>
        </LanguageProvider>
      </ThemeContext.Provider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootNavigator />;
}
