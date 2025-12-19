import { DarkTheme as NavDark, DefaultTheme as NavLight, Theme } from '@react-navigation/native';
import Colors, { ThemePalette } from './Colors';

export function createNavigationTheme(isDark: boolean, palette: ThemePalette): Theme {
  const base = isDark ? NavDark : NavLight;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: Colors.dhbwRed,
      background: palette.background,
      card: palette.card,
      text: palette.text,
      border: palette.borderSubtle,
      notification: Colors.dhbwRed,
    },
  };
}
