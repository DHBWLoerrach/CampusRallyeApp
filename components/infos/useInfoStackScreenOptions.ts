import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';

/**
 * Header styling shared by both info stacks: the one inside the rallye tabs
 * and the public one reachable from the welcome screen.
 */
export function useInfoStackScreenOptions() {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  return {
    headerStyle: { backgroundColor: palette.background },
    headerTitleStyle: { color: palette.text },
    headerTintColor: palette.text,
  };
}
