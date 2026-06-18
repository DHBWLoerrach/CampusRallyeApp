import React from 'react';
import { render } from '@testing-library/react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import TabLayout from '../_layout';

type NativeTabsProps = {
  backgroundColor?: string;
  children: React.ReactNode;
  tintColor?: string;
};

type NativeTabTriggerProps = {
  children: React.ReactNode;
  name: string;
};

jest.mock('expo-router/unstable-native-tabs', () => ({
  NativeTabs: Object.assign(
    jest.fn(({ children }: NativeTabsProps) => children),
    {
      Trigger: Object.assign(
        jest.fn(({ children }: NativeTabTriggerProps) => children),
        {
          Icon: jest.fn(() => null),
          Label: jest.fn(
            ({ children }: { children: React.ReactNode }) => children
          ),
        }
      ),
    }
  ),
}));

const mockNativeTabs = NativeTabs as unknown as jest.Mock;
const mockNativeTabsTrigger = NativeTabs.Trigger as unknown as jest.Mock;
const mockNativeTabsIcon = NativeTabs.Trigger.Icon as unknown as jest.Mock;
const mockNativeTabsLabel = NativeTabs.Trigger.Label as unknown as jest.Mock;

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe('TabLayout', () => {
  beforeEach(() => {
    mockNativeTabs.mockClear();
    mockNativeTabsTrigger.mockClear();
    mockNativeTabsIcon.mockClear();
    mockNativeTabsLabel.mockClear();
  });

  it('renders static native tabs for rallye and infos', () => {
    render(<TabLayout />);

    expect(mockNativeTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        minimizeBehavior: 'onScrollDown',
        tintColor: '#E2001A',
      }),
      undefined
    );
    expect(mockNativeTabsTrigger).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'rallye' }),
      undefined
    );
    expect(mockNativeTabsTrigger).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'infos' }),
      undefined
    );
    expect(mockNativeTabsLabel).toHaveBeenCalledWith(
      expect.objectContaining({ children: 'Rallye' }),
      undefined
    );
    expect(mockNativeTabsLabel).toHaveBeenCalledWith(
      expect.objectContaining({ children: 'Infos' }),
      undefined
    );
  });
});
