import React, { ReactNode } from 'react';
import { Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';

type Size = 'small' | 'medium' | 'dialog';

type UIButtonProps = {
  color?: string;
  disabled?: boolean;
  icon?: any; // FontAwesome6 icon name
  iconRight?: boolean;
  outline?: boolean;
  onPress?: () => void;
  size?: Size;
  children?: ReactNode;
};

export default function UIButton({
  color,
  disabled,
  icon,
  iconRight = false,
  outline = false,
  onPress,
  size = 'small',
  children,
}: UIButtonProps) {
  let buttonStyle: ViewStyle = {
    ...(globalStyles.uiButtonStyles.button.sizes as any)[size],
    backgroundColor: color ?? Colors.dhbwRed,
    flexDirection: iconRight ? 'row-reverse' : 'row',
  };
  let textStyle: TextStyle = (globalStyles.uiButtonStyles.textSizes as any)[
    size
  ];
  if (outline) {
    buttonStyle = {
      ...buttonStyle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color ?? Colors.dhbwRed,
      backgroundColor: 'transparent',
    };
    textStyle = {
      ...textStyle,
      color: color ?? Colors.dhbwRed,
    } as TextStyle;
  }

  return (
    <Pressable
      style={[
        (globalStyles.uiButtonStyles.button as any).container,
        buttonStyle,
        disabled ? (globalStyles.uiButtonStyles.button as any).disabled : '',
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? (
        <FontAwesome6
          name={icon}
          size={20}
          color="white"
          style={{ marginRight: 10 }}
        />
      ) : null}
      <Text style={[
        (globalStyles.uiButtonStyles.button as any).text,
        textStyle,
      ]}>
        {children as any}
      </Text>
    </Pressable>
  );
}

