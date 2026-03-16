import React from 'react';
import { render } from '@testing-library/react-native';
import TabLayout from '../_layout';

type ScreenOptions = {
  headerLeft?: () => React.ReactNode;
  headerTitle?: () => React.ReactNode;
  headerRight?: () => React.ReactNode;
};

let mockCapturedScreenOptions: ScreenOptions | undefined;

jest.mock('expo-router', () => ({
  Tabs: Object.assign(
    ({
      screenOptions,
      children,
    }: {
      screenOptions: ScreenOptions;
      children: React.ReactNode;
    }) => {
      mockCapturedScreenOptions = screenOptions;
      return <>{children}</>;
    },
    {
      Screen: () => null,
    }
  ),
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => null,
}));

jest.mock('@/components/rallye/RallyeHeader', () => () => null);
jest.mock('@/components/rallye/RallyeHeaderActions', () => () => null);

describe('TabLayout', () => {
  beforeEach(() => {
    mockCapturedScreenOptions = undefined;
  });

  it('renders the team on the left and actions on the right', () => {
    render(<TabLayout />);

    expect(typeof mockCapturedScreenOptions?.headerLeft).toBe('function');
    expect(typeof mockCapturedScreenOptions?.headerRight).toBe('function');
    expect(mockCapturedScreenOptions?.headerTitle?.()).toBeNull();
  });
});
