import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Colors from '@/utils/Colors';
import ThemedText from '@/components/themed/ThemedText';
import { useTheme } from '@/utils/ThemeContext';

type InfoCardTone = 'default' | 'subtle';

type InfoCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: InfoCardTone;
};

type InfoSectionHeaderProps = {
  label: string;
  title: string;
};

type InfoLinkCardProps = {
  accessibilityLabel?: string;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  value: string;
};

export const infoScreenStyles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  eyebrow: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bodyText: {
    lineHeight: 24,
  },
  linkCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 6,
  },
  linkValue: {
    lineHeight: 24,
    color: Colors.dhbwRed,
  },
});

export function InfoCard({
  children,
  style,
  tone = 'default',
}: InfoCardProps) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const backgroundColor =
    tone === 'subtle' ? palette.surface2 : palette.surface1;

  return (
    <View
      style={[
        infoScreenStyles.card,
        {
          backgroundColor,
          borderColor: palette.borderSubtle,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function InfoSectionHeader({
  label,
  title,
}: InfoSectionHeaderProps) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  return (
    <View style={infoScreenStyles.sectionHeader}>
      <ThemedText
        variant="caption"
        style={[infoScreenStyles.eyebrow, { color: palette.textMuted }]}
      >
        {label}
      </ThemedText>
      <ThemedText variant="subtitle">{title}</ThemedText>
    </View>
  );
}

export function InfoLinkCard({
  accessibilityLabel,
  label,
  onPress,
  style,
  value,
}: InfoLinkCardProps) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [
        infoScreenStyles.linkCard,
        {
          backgroundColor: palette.surface2,
          borderColor: palette.borderSubtle,
          opacity: pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      <ThemedText variant="bodyStrong">{label}</ThemedText>
      <ThemedText selectable style={infoScreenStyles.linkValue}>
        {value}
      </ThemedText>
    </Pressable>
  );
}
