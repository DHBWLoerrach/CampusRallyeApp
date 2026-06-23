import { StyleSheet, View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import ThemedText from '@/components/themed/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { store$ } from '@/services/storage/Store';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';

export default function RallyeContextBar() {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const team = useSelector(() => store$.team.get());

  if (!team?.name) return null;

  return (
    <View style={styles.container}>
      <IconSymbol name="person.3" size={16} color={palette.text} />
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
  teamName: {
    flexShrink: 1,
  },
});
