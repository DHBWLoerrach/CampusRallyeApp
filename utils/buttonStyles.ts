import Colors, { type ThemePalette } from '@/utils/Colors';

export function getSoftCtaButtonStyles(palette: ThemePalette) {
  return {
    buttonStyle: {
      backgroundColor: palette.surface2,
      borderWidth: 1,
      borderColor: palette.borderSubtle,
    },
    textStyle: { color: Colors.dhbwRed },
  };
}
