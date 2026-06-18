import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from '@legendapp/state/react';
import { Text, View } from 'react-native';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';
import { store$ } from '@/services/storage/Store';

const DISPLAY_DURATION_MS = 3000;

export default function TeamNameSheetScreen() {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const name = useSelector(() => store$.team.get()?.name ?? '');
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  useEffect(() => {
    if (!name) {
      if (router.canGoBack()) router.back();
      return;
    }

    const id = setTimeout(() => {
      if (router.canGoBack()) router.back();
    }, DISPLAY_DURATION_MS);

    return () => clearTimeout(id);
  }, [name, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: palette.card,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          color: palette.text,
          textAlign: 'center',
          marginBottom: 6,
          opacity: 0.8,
        }}
      >
        {t('team.sheetTitle')}
      </Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '600',
          color: Colors.dhbwRed,
          textAlign: 'center',
        }}
      >
        {name}
      </Text>
    </View>
  );
}
