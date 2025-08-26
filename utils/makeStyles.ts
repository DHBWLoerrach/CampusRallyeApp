import { useMemo } from 'react';
import { StyleSheet, StyleProp } from 'react-native';
import Colors, { ThemePalette } from './Colors';
import { useTheme } from './ThemeContext';

type StylesFactory<T> = (palette: ThemePalette) => T | StyleProp<any>;

// Creates a theme-aware styles hook.
export function makeStyles<T extends Record<string, any>>(factory: StylesFactory<T>) {
  return function useStyles() {
    const { isDarkMode } = useTheme();
    const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
    // Cache per palette identity; palette object identity is stable per mode.
    return useMemo(() => StyleSheet.create(factory(palette) as any) as T, [palette]);
  };
}

