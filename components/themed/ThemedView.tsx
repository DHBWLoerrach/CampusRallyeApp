import React from 'react';
import { View, type ViewProps } from 'react-native';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';

type Variant = 'background' | 'card' | 'transparent';

export default function ThemedView({
  variant = 'background',
  style,
  ...rest
}: ViewProps & { variant?: Variant }) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const backgroundColor =
    variant === 'background'
      ? palette.surface0
      : variant === 'card'
        ? palette.surface1
        : 'transparent';
  return <View style={[{ backgroundColor }, style]} {...rest} />;
}
