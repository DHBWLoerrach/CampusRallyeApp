import React, { PropsWithChildren } from 'react';
import { ViewProps } from 'react-native';
import ThemedView from '@/components/themed/ThemedView';
import { globalStyles } from '@/utils/GlobalStyles';
import { useAppStyles } from '@/utils/AppStyles';
import { spacing } from '@/utils/spacing';
import { useTheme } from '@/utils/ThemeContext';
import Colors from '@/utils/Colors';

type Props = ViewProps & {
  // Bottom margin as spacing token (8px each)
  mb?: number;
  // Optional maxHeight override (use sparingly)
  maxHeight?: number;
};

// Theme-aware card-like container that applies structural layout
// from GlobalStyles and themed colors from AppStyles/ThemedView.
export default function InfoBox({ mb = 2, maxHeight, style, children, ...rest }: PropsWithChildren<Props>) {
  const s = useAppStyles();
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const surfaceStyle = isDarkMode
    ? {
        borderWidth: 1,
        borderColor: palette.borderSubtle,
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      }
    : null;
  return (
    <ThemedView
      variant="card"
      style={[
        globalStyles.rallyeStatesStyles.infoBox,
        s.infoBox,
        mb ? { marginBottom: spacing(mb) } : null,
        maxHeight ? { maxHeight } : null,
        style,
        surfaceStyle,
      ]}
      {...rest}
    >
      {children}
    </ThemedView>
  );
}
