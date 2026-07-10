import { View } from 'react-native';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';
import Colors from '@/utils/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ThemedText from '@/components/themed/ThemedText';

function formatPlannedEndTime(endTime: string, language: 'de' | 'en') {
  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/.exec(
    endTime
  );
  if (!match) return endTime;

  const [, hours, minutes, seconds = '00', fractionalSeconds = ''] = match;
  const hour = Number(hours);
  const minute = Number(minutes);
  const second = Number(seconds);
  const isMidnightBoundary =
    hour === 24 && minute === 0 && second === 0 && /^0*$/.test(fractionalSeconds);
  if (
    hour > 24 ||
    minute > 59 ||
    second > 59 ||
    (hour === 24 && !isMidnightBoundary)
  ) {
    return endTime;
  }

  const normalizedHour = isMidnightBoundary ? 0 : hour;
  const formattedHours = String(normalizedHour).padStart(2, '0');
  if (language === 'de') return `${formattedHours}:${minutes}`;

  const twelveHour = ((normalizedHour + 11) % 12) + 1;
  const period = normalizedHour < 12 ? 'AM' : 'PM';
  return `${String(twelveHour).padStart(2, '0')}:${minutes} ${period}`;
}

export default function PlannedEndInfo({
  endTime,
}: {
  endTime?: string | null;
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
