import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from 'expo-router';
import { store$ } from '@/services/storage/Store';
import { LanguageProvider } from '@/utils/LanguageContext';

function RootNavigator() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  useEffect(() => {
    // Initialize the store
    store$.initialize();
  }, []);

  if (!loaded || !navState?.key) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LanguageProvider>
        <Stack>
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false,
              title: 'Welcome'
            }} 
          />
          <Stack.Screen 
            name="rally" 
            options={{ 
              headerShown: false,
              title: 'Rally'
            }} 
          />
          <Stack.Screen 
            name="explore" 
            options={{ 
              headerShown: false,
              title: 'Explore'
            }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false 
            }} 
          />
        </Stack>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootNavigator />;
}
