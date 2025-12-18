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
};

export default function Card({
  title,
  description,
  icon,
  onPress,
  accessibilityLabel,
  children,
}: PropsWithChildren<Props>) {
  const { isDarkMode } = useTheme();
  const backgroundColor = isDarkMode ? Colors.darkMode.card : Colors.lightMode.card;

  const content = (
    <>
      <IconSymbol name={icon} size={40} color={Colors.dhbwRed} />
      <ThemedText style={globalStyles.cardStyles.cardTitle} variant="title">
        {title}
      </ThemedText>
      <ThemedText style={globalStyles.cardStyles.cardDescription}>
        {description}
      </ThemedText>
      {children ? <View style={{ width: '100%', marginTop: 14 }}>{children}</View> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[globalStyles.cardStyles.card, { backgroundColor }]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        globalStyles.cardStyles.card,
        { backgroundColor },
        pressed ? { opacity: 0.92, transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      {content}
    </Pressable>
  );
}
