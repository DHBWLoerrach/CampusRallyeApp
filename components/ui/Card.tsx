import React, { PropsWithChildren } from 'react';
import {
  Dimensions,
  Pressable,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useTheme } from '@/utils/ThemeContext';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import ThemedText from '@/components/themed/ThemedText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 700;
const ICON_SIZE_SMALL = IS_SMALL_SCREEN ? 20 : 24;
const ICON_SIZE_LARGE = IS_SMALL_SCREEN ? 32 : 40;

type Props = {
  title: string;
  description: string;
  icon: IconSymbolName;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** Layout style: 'horizontal' puts icon left of title, 'vertical' puts icon above title */
  layout?: 'horizontal' | 'vertical';
};

export default function Card({
  title,
  description,
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  containerStyle,
  children,
  layout = 'horizontal',
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

  const isVertical = layout === 'vertical';
  const iconSize = isVertical ? ICON_SIZE_LARGE : ICON_SIZE_SMALL;

  const content = (
    <>
      {isVertical ? (
        // Vertical layout: icon above title (centered)
        <>
          <IconSymbol name={icon} size={iconSize} color={Colors.dhbwRed} />
          <ThemedText
            style={[globalStyles.cardStyles.cardTitle, { textAlign: 'center' }]}
            variant="bodyStrong"
          >
            {title}
          </ThemedText>
        </>
      ) : (
        // Horizontal layout: icon left of title
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          <IconSymbol name={icon} size={iconSize} color={Colors.dhbwRed} />
          <ThemedText
            style={[globalStyles.cardStyles.cardTitle, { marginLeft: 8, marginTop: 0, flex: 1 }]}
            variant="bodyStrong"
          >
            {title}
          </ThemedText>
        </View>
      )}
      <ThemedText
        style={[
          globalStyles.cardStyles.cardDescription,
          isVertical && { textAlign: 'center' },
        ]}
        variant="bodySmall"
      >
        {description}
      </ThemedText>
      {children ? (
        <View style={{ width: '100%', marginTop: IS_SMALL_SCREEN ? 10 : 14 }}>
          {children}
        </View>
      ) : null}
    </>
  );

  const verticalCardStyle = isVertical
    ? {
        alignItems: 'center' as const,
        minHeight: SCREEN_HEIGHT * (IS_SMALL_SCREEN ? 0.16 : 0.22),
      }
    : null;

  if (!onPress) {
    return (
      <View
        style={[
          globalStyles.cardStyles.card,
          { backgroundColor },
          surfaceStyle,
          verticalCardStyle,
          containerStyle,
        ]}
      >
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
        verticalCardStyle,
        containerStyle,
        pressed ? { opacity: 0.92, transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      {content}
    </Pressable>
  );
}
