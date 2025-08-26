import React from 'react';
import { TextInput as RNTextInput, TextInputProps, StyleSheet } from 'react-native';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';

type Props = TextInputProps & {
  bordered?: boolean;
};

export default function ThemedTextInput({ bordered = true, style, placeholderTextColor, ...rest }: Props) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  const baseStyle = {
    color: palette.text,
    ...(bordered
      ? {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.text,
          borderRadius: 5,
        }
      : {}),
  } as const;

  return (
    <RNTextInput
      style={[baseStyle, style]}
      placeholderTextColor={placeholderTextColor ?? Colors.mediumGray}
      {...rest}
    />
  );
}

