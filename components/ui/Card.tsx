import React, { PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useTheme } from '@/utils/ThemeContext';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import ThemedText from '@/components/themed/ThemedText';

type Props = {
  title: string;
  description: string;
  icon: IconSymbolName;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export default function Card({
  title,
  description,
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  children,
}: PropsWithChildren<Props>) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const backgroundColor = palette.surface1;
  const surfaceStyle = isDarkMode
    ? {
        borderWidth: 1,
        borderColor: palette.borderSubtle,
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      }
    : null;

  const content = (
    <>
      <IconSymbol name={icon} size={40} color={Colors.dhbwRed} />
      <ThemedText style={globalStyles.cardStyles.cardTitle} variant="bodyStrong">
        {title}
      </ThemedText>
      <ThemedText style={globalStyles.cardStyles.cardDescription} variant="bodySmall">
        {description}
      </ThemedText>
      {children ? <View style={{ width: '100%', marginTop: 14 }}>{children}</View> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[globalStyles.cardStyles.card, { backgroundColor }, surfaceStyle]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        globalStyles.cardStyles.card,
        { backgroundColor },
        surfaceStyle,
        pressed ? { opacity: 0.92, transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      {content}
    </Pressable>
  );
}
