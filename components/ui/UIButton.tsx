import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';

type Size = 'small' | 'medium' | 'dialog';

type UIButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  color?: string;
  disabled?: boolean;
  icon?: any; // FontAwesome6 icon name
  iconRight?: boolean;
  loading?: boolean;
  outline?: boolean;
  onPress?: () => void;
  size?: Size;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  textStyle?: StyleProp<TextStyle>;
};

export default function UIButton({
  accessibilityHint,
  accessibilityLabel,
  color,
  disabled,
  icon,
  iconRight = false,
  loading = false,
  outline = false,
  onPress,
  size = 'small',
  style,
  children,
  textStyle: textStyleProp,
}: UIButtonProps) {
  const isDisabled = disabled || loading;

  const contentColor = outline ? color ?? Colors.dhbwRed : 'white';

  let buttonStyle: ViewStyle = {
    ...(globalStyles.uiButtonStyles.button.sizes as any)[size],
    backgroundColor: outline ? 'transparent' : (color ?? Colors.dhbwRed),
    flexDirection: iconRight ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  };
  let textStyle: TextStyle = (globalStyles.uiButtonStyles.textSizes as any)[
    size
  ];
  if (outline) {
    buttonStyle = {
      ...buttonStyle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color ?? Colors.dhbwRed,
    };
    textStyle = {
      ...textStyle,
      color: color ?? Colors.dhbwRed,
    } as TextStyle;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        (globalStyles.uiButtonStyles.button as any).container,
        buttonStyle,
        isDisabled ? { opacity: 0.55 } : null,
        pressed && !isDisabled ? { opacity: 0.9, transform: [{ scale: 0.99 }] } : null,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : icon ? (
        <FontAwesome6 name={icon} size={20} color={contentColor} />
      ) : null}
      <Text style={[
        (globalStyles.uiButtonStyles.button as any).text,
        textStyle,
        textStyleProp,
      ]}>
        {children as any}
      </Text>
    </Pressable>
  );
}
