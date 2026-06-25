import { StyleSheet, View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import ThemedText from '@/components/themed/ThemedText';
import { store$ } from '@/services/storage/Store';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';

export default function RallyeContextBar() {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const { t } = useLanguage();
  const team = useSelector(() => store$.team.get());

  if (!team?.name) return null;

  return (
    <View style={styles.container}>
      <ThemedText
        variant="label"
        style={[styles.contextLabel, { color: palette.textMuted }]}
      >
        {t('rallye.currentTeamLabel')}
      </ThemedText>
      <ThemedText variant="label" style={styles.teamName}>
        {team.name}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  contextLabel: {
    flexShrink: 0,
  },
  teamName: {
    flexShrink: 1,
    fontWeight: '700',
  },
});
