import React, { type ReactNode } from 'react';
import {
  Dimensions,
  Image,
  type ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ThemedText from '@/components/themed/ThemedText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive header dimensions based on screen size
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 700;
const HEADER_MAX_HEIGHT = SCREEN_HEIGHT * (IS_SMALL_SCREEN ? 0.22 : 0.28);
const HEADER_MIN_HEIGHT = IS_SMALL_SCREEN ? 80 : 100;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

type CollapsibleHeroHeaderProps = {
  /** Hero background image */
  heroImage: ImageSourcePropType;
  /** App logo image */
  logoImage: ImageSourcePropType;
  /** Title text */
  title: string;
  /** Scrollable content */
  children: ReactNode;
  /** Content container style */
  contentContainerStyle?: object;
};

/**
 * A scroll view with a collapsible hero header that shrinks as the user scrolls.
 * The header contains a hero image with gradient overlay, title, logo, and language toggle.
 */
export function CollapsibleHeroHeader({
  heroImage,
  logoImage,
  title,
  children,
  contentContainerStyle,
}: CollapsibleHeroHeaderProps) {
  const { isDarkMode } = useTheme();
  const { t, toggleLanguage, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animated header height
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolation.CLAMP
    );
    return { height };
  });

  // Animated image scale for parallax effect
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0, HEADER_SCROLL_DISTANCE],
      [1.3, 1, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [0, -HEADER_SCROLL_DISTANCE * 0.5],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  // Animated title opacity (fades out as header collapses)
  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE * 0.6],
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [0, -20],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ translateY }] };
  });

  // Animated logo that moves to center when collapsed
  const logoAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [1, 0.7],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        {/* Hero Image with Parallax */}
        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
          <Image source={heroImage} style={styles.heroImage} />
        </Animated.View>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
          locations={[0.3, 1]}
        />

        {/* Language Toggle */}
        <TouchableOpacity
          style={[styles.languageToggle, { top: insets.top + 8 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.languageToggleCurrent', {
            language: t(`a11y.languageName.${language}`),
          })}
          accessibilityHint={t('a11y.languageToggleHintTarget', {
            language: t(`a11y.languageName.${language === 'de' ? 'en' : 'de'}`),
          })}
          onPress={toggleLanguage}
        >
          <IconSymbol name="globe" size={18} color="#FFFFFF" />
          <ThemedText style={styles.languageText}>
            {language.toUpperCase()}
          </ThemedText>
        </TouchableOpacity>

        {/* Title and Logo (positioned at bottom of header) */}
        <Animated.View
          style={[
            styles.titleContainer,
            { paddingBottom: 16, paddingHorizontal: 16 },
            titleAnimatedStyle,
          ]}
        >
          <ThemedText style={styles.title}>{title}</ThemedText>
          <Animated.View style={logoAnimatedStyle}>
            <Image source={logoImage} style={styles.logo} />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_MAX_HEIGHT },
          contentContainerStyle,
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.contentWrapper,
            { backgroundColor: palette.background },
          ]}
        >
          {children}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HEADER_MAX_HEIGHT + 50, // Extra height for parallax
    resizeMode: 'cover',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  languageToggle: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: IS_SMALL_SCREEN ? 16 : 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  logo: {
    width: IS_SMALL_SCREEN ? 30 : 36,
    height: IS_SMALL_SCREEN ? 30 : 36,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20, // Overlap the header slightly
    paddingTop: IS_SMALL_SCREEN ? 16 : 24,
    paddingHorizontal: IS_SMALL_SCREEN ? 12 : 16,
    minHeight: SCREEN_HEIGHT - HEADER_MIN_HEIGHT,
  },
});

export default CollapsibleHeroHeader;
