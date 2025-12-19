import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge, type SafeAreaViewProps } from 'react-native-safe-area-context';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';

export const SCREEN_PADDING = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24,
} as const;

type PaddingSize = keyof typeof SCREEN_PADDING;

type ScreenBaseProps = {
  padding?: PaddingSize;
  keyboardAvoiding?: boolean;
};

type ScreenProps = ScreenBaseProps &
  Omit<SafeAreaViewProps, 'edges'> & {
    edges?: Edge[];
    contentStyle?: StyleProp<ViewStyle>;
  };

export function Screen({
  padding = 'md',
  keyboardAvoiding = false,
  edges,
  contentStyle,
  style,
  children,
  ...rest
}: ScreenProps) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const content = (
    <View style={[{ flex: 1, padding: SCREEN_PADDING[padding] }, contentStyle]}>
      {children}
    </View>
  );
  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: palette.background }, style]}
      edges={edges ?? ['top', 'bottom']}
      {...rest}
    >
      {body}
    </SafeAreaView>
  );
}

type ScreenScrollViewProps = ScreenBaseProps & {
  edges?: Edge[];
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
} & Omit<ScrollViewProps, 'contentContainerStyle'>;

export function ScreenScrollView({
  padding = 'md',
  keyboardAvoiding = false,
  edges,
  containerStyle,
  contentContainerStyle,
  style,
  ...rest
}: ScreenScrollViewProps) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const scroll = (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[
        { flexGrow: 1, padding: SCREEN_PADDING[padding] },
        contentContainerStyle,
      ]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      {...rest}
    />
  );
  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scroll}
    </KeyboardAvoidingView>
  ) : (
    scroll
  );

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: palette.background }, containerStyle]}
      edges={edges ?? ['top', 'bottom']}
    >
      {body}
    </SafeAreaView>
  );
}
