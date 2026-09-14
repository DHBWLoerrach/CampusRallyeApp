import { Stack, useRouter } from 'expo-router';
import { HeaderBackButton } from 'expo-router/react-navigation';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';

export default function WelcomeInfosLayout() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTitleStyle: { color: palette.text },
        headerTintColor: palette.text,
        headerBackTitle: t('common.back'),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('infos.title'),
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              label={t('common.back')}
              accessibilityLabel={t('common.back')}
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/');
              }}
            />
          ),
        }}
      />
      <Stack.Screen name="imprint" options={{ title: t('infos.imprint') }} />
      <Stack.Screen name="about" options={{ title: t('infos.about') }} />
    </Stack>
  );
}
