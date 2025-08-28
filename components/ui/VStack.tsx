import React, { PropsWithChildren } from 'react';
import { View, ViewProps } from 'react-native';
import { spacing } from '@/utils/spacing';

type Props = ViewProps & {
  // Gap in spacing tokens (8px each). Example: gap={2} => 16px
  gap?: number;
};

// Simple vertical stack with configurable gap between children.
export default function VStack({ gap = 2, style, children, ...rest }: PropsWithChildren<Props>) {
  return (
    <View style={[{ gap: spacing(gap) }, style]} {...rest}>
      {children}
    </View>
  );
}

