import { Stack, useRouter } from 'expo-router';
import { HeaderBackButton } from 'expo-router/react-navigation';
import { useInfoStackScreenOptions } from '@/components/infos/useInfoStackScreenOptions';
import { useLanguage } from '@/utils/LanguageContext';

export default function WelcomeInfosLayout() {
  const router = useRouter();
  const { t } = useLanguage();
  const screenOptions = useInfoStackScreenOptions();

  return (
    <Stack
      screenOptions={{ ...screenOptions, headerBackTitle: t('common.back') }}
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
