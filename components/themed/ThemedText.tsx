import React from 'react';
import { Text, type TextProps } from 'react-native';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import { TYPOGRAPHY, type TypographyVariant } from '@/utils/Typography';

type Variant = TypographyVariant | 'muted' | 'accent';

export default function ThemedText({
  variant = 'body',
  style,
  ...rest
}: TextProps & { variant?: Variant }) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const baseVariant =
    variant === 'muted' || variant === 'accent' ? 'body' : variant;
  const color =
    variant === 'muted'
      ? palette.textMuted
      : variant === 'accent'
        ? Colors.dhbwRed
        : palette.text;
  return <Text style={[TYPOGRAPHY[baseVariant], { color }, style]} {...rest} />;
}
