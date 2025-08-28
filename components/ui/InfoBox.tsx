import React, { PropsWithChildren } from 'react';
import { ViewProps } from 'react-native';
import ThemedView from '@/components/themed/ThemedView';
import { globalStyles } from '@/utils/GlobalStyles';
import { useAppStyles } from '@/utils/AppStyles';
import { spacing } from '@/utils/spacing';

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
  return (
    <ThemedView
      variant="card"
      style={[
        globalStyles.rallyeStatesStyles.infoBox,
        s.infoBox,
        mb ? { marginBottom: spacing(mb) } : null,
        maxHeight ? { maxHeight } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </ThemedView>
  );
}

