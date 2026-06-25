import { Dimensions, type TextStyle } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 375;

const scaleFont = (size: number) =>
  Math.round(size * (SCREEN_WIDTH / BASE_WIDTH));
const scaleLineHeight = (size: number, ratio: number) =>
  Math.round(scaleFont(size) * ratio);

export const TYPOGRAPHY = {
  screenTitle: {
    fontSize: scaleFont(24),
    lineHeight: scaleLineHeight(24, 1.3),
    fontWeight: '600',
  },
  dialogTitle: {
    fontSize: scaleFont(22),
    lineHeight: scaleLineHeight(22, 1.3),
    fontWeight: '700',
  },
  metric: {
    fontSize: scaleFont(28),
    lineHeight: scaleLineHeight(28, 1.25),
    fontWeight: '700',
  },
  title: {
    fontSize: scaleFont(20),
    lineHeight: scaleLineHeight(20, 1.3),
    fontWeight: '600',
  },
  subtitle: {
    fontSize: scaleFont(18),
    lineHeight: scaleLineHeight(18, 1.3),
    fontWeight: '600',
  },
  body: {
    fontSize: scaleFont(16),
    lineHeight: scaleLineHeight(16, 1.4),
    fontWeight: '400',
  },
  bodyStrong: {
    fontSize: scaleFont(16),
    lineHeight: scaleLineHeight(16, 1.4),
    fontWeight: '500',
  },
  bodyLarge: {
    fontSize: scaleFont(18),
    lineHeight: scaleLineHeight(18, 1.4),
    fontWeight: '400',
  },
  optionText: {
    fontSize: scaleFont(20),
    lineHeight: scaleLineHeight(20, 1.35),
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: scaleFont(14),
    lineHeight: scaleLineHeight(14, 1.4),
    fontWeight: '400',
  },
  label: {
    fontSize: scaleFont(14),
    lineHeight: scaleLineHeight(14, 1.3),
    fontWeight: '500',
  },
  caption: {
    fontSize: scaleFont(12),
    lineHeight: scaleLineHeight(12, 1.3),
    fontWeight: '400',
  },
  button: {
    fontSize: scaleFont(16),
    lineHeight: scaleLineHeight(16, 1.2),
    fontWeight: '600',
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof TYPOGRAPHY;
