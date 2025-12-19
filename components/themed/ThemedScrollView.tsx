import React from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';

type Variant = 'background' | 'card' | 'transparent';

export default function ThemedScrollView({ variant = 'background', style, ...rest }: ScrollViewProps & { variant?: Variant }) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const backgroundColor =
    variant === 'background'
      ? palette.surface0
      : variant === 'card'
        ? palette.surface1
        : 'transparent';
  return <ScrollView style={[{ backgroundColor }, style]} {...rest} />;
}
