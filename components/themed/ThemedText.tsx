import React from 'react';
import { Text, type TextProps } from 'react-native';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';

type Variant = 'body' | 'title' | 'muted' | 'accent';

export default function ThemedText({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const color =
    variant === 'muted'
      ? palette.textMuted
      : variant === 'accent'
        ? Colors.dhbwRed
        : palette.text;
  const fontWeight = variant === 'title' ? '600' : undefined;
  return <Text style={[{ color, fontWeight }, style]} {...rest} />;
}
