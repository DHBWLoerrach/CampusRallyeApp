import { View } from 'react-native';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';
import Colors from '@/utils/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ThemedText from '@/components/themed/ThemedText';

function formatPlannedEndTime(endTime: string | Date, language: 'de' | 'en') {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  return new Date(endTime).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PlannedEndInfo({
  endTime,
}: {
  endTime?: string | Date | null;
}) {
  const { isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  if (!endTime) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <IconSymbol name="clock" size={16} color={palette.text} />
      <ThemedText variant="label">
        {t('rallye.plannedEnd', {
          time: formatPlannedEndTime(endTime, language),
        })}
      </ThemedText>
    </View>
  );
}
