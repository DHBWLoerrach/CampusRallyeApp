import React from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps,
  StyleSheet,
} from 'react-native';
import Colors from '@/utils/Colors';
import Constants from '@/utils/Constants';
import { useTheme } from '@/utils/ThemeContext';

type Props = TextInputProps & {
  bordered?: boolean;
};

export default function ThemedTextInput({
  bordered = true,
  style,
  placeholderTextColor,
  ...rest
}: Props) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  const baseStyle = {
    color: palette.text,
    paddingVertical: 10,
    textAlignVertical: 'center' as const,
    ...(bordered
      ? {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDarkMode ? Colors.dhbwGray : Colors.dhbwGray,
          borderRadius: Constants.cornerRadius,
        }
      : {}),
  } as const;

  return (
    <RNTextInput
      style={[baseStyle, style]}
      placeholderTextColor={
        placeholderTextColor ??
        (isDarkMode ? Colors.lightGray : Colors.mediumGray)
      }
      {...rest}
    />
  );
}
