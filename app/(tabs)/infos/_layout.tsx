import { Stack } from 'expo-router';
import { useInfoStackScreenOptions } from '@/components/infos/useInfoStackScreenOptions';
import { useLanguage } from '@/utils/LanguageContext';

export default function InfosStackLayout() {
  const { t } = useLanguage();
  const screenOptions = useInfoStackScreenOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: t('infos.title') }} />
      <Stack.Screen name="imprint" options={{ title: t('infos.imprint') }} />
      <Stack.Screen name="about" options={{ title: t('infos.about') }} />
    </Stack>
  );
}
