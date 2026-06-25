import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import RallyeStackLayout from '../_layout';
import { confirm } from '@/utils/ConfirmAlert';
import { store$ } from '@/services/storage/Store';

type StackProps = {
  children: React.ReactNode;
};

type StackScreenProps = {
  children?: React.ReactNode;
  name: string;
  options?: Record<string, unknown>;
};

type StackToolbarProps = {
  children: React.ReactNode;
  placement: string;
};

type StackToolbarButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  icon?: string;
  onPress?: () => void;
};

let mockRallye: { status: string; end_time: string | null } | null = null;
let mockIsTourMode = false;
let mockEnabled = true;

jest.mock('expo-router', () => ({
  Stack: Object.assign(
    jest.fn(({ children }: StackProps) => children),
    {
      Screen: jest.fn(({ children }: StackScreenProps) => children),
      Toolbar: Object.assign(
        jest.fn(({ children }: StackToolbarProps) => children),
        {
          Button: jest.fn(() => null),
          View: jest.fn(({ children }: { children: React.ReactNode }) => (
            <>{children}</>
          )),
        }
      ),
    }
  ),
}));

const mockStack = Stack as unknown as jest.Mock;
const mockStackScreen = Stack.Screen as unknown as jest.Mock;
const mockStackToolbar = Stack.Toolbar as unknown as jest.Mock;
const mockStackToolbarButton = Stack.Toolbar.Button as unknown as jest.Mock;
const mockStackToolbarView = Stack.Toolbar.View as unknown as jest.Mock;

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    clearRallyeSession: jest.fn(),
    enabled: { get: () => mockEnabled },
    rallye: { get: () => mockRallye },
    isTourMode: { get: () => mockIsTourMode },
    leaveRallye: jest.fn(),
  },
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/utils/ConfirmAlert', () => ({
  confirm: jest.fn(async () => true),
}));

jest.mock('@/components/rallye/TimerHeader', () => () => null);
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));

type ScreenOptions = {
  headerRight?: () => React.ReactElement;
};

const getIndexScreenOptions = (): ScreenOptions | undefined => {
  const indexCall = mockStackScreen.mock.calls.find(
    ([props]: [StackScreenProps]) => props.name === 'index'
  );
  return indexCall?.[0]?.options as ScreenOptions | undefined;
};

const setPlatform = (os: 'ios' | 'android') => {
  Platform.OS = os;
};

describe('RallyeStackLayout', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    mockRallye = {
      status: 'running',
      end_time: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
    mockIsTourMode = false;
    mockEnabled = true;
    mockStack.mockClear();
    mockStackScreen.mockClear();
    mockStackToolbar.mockClear();
    mockStackToolbarButton.mockClear();
    mockStackToolbarView.mockClear();
    jest.clearAllMocks();
    setPlatform('ios');
  });

  afterEach(() => {
    setPlatform(originalPlatform as 'ios' | 'android');
  });

  it('renders a native logout toolbar button on iOS', async () => {
    render(<RallyeStackLayout />);

    expect(mockStackToolbar).toHaveBeenCalledWith(
      expect.objectContaining({ placement: 'right' }),
      undefined
    );
    expect(mockStackToolbarButton).toHaveBeenCalledWith(
      expect.objectContaining({
        accessibilityHint: 'a11y.logoutButtonHint',
        accessibilityLabel: 'a11y.logoutButton',
        icon: 'rectangle.portrait.and.arrow.right',
      }),
      undefined
    );
    expect(mockStackToolbarView).not.toHaveBeenCalled();

    const buttonProps = (mockStackToolbarButton as jest.Mock).mock.calls.at(
      -1
    )?.[0] as StackToolbarButtonProps | undefined;
    buttonProps?.onPress?.();

    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'confirm.exit.title',
          destructive: true,
        })
      );
      expect(store$.leaveRallye).toHaveBeenCalledTimes(1);
    });

    // iOS uses the native toolbar, not a header button.
    expect(getIndexScreenOptions()?.headerRight).toBeUndefined();
  });

  it('renders a header logout button on Android', async () => {
    setPlatform('android');
    render(<RallyeStackLayout />);

    // The Android floating bottom toolbar is intentionally not used.
    expect(mockStackToolbar).not.toHaveBeenCalled();
    expect(mockStackToolbarButton).not.toHaveBeenCalled();

    const headerRight = getIndexScreenOptions()?.headerRight;
    expect(headerRight).toBeInstanceOf(Function);

    const { getByLabelText } = render(headerRight!());
    fireEvent.press(getByLabelText('a11y.logoutButton'));

    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'confirm.exit.title',
          destructive: true,
        })
      );
      expect(store$.leaveRallye).toHaveBeenCalledTimes(1);
    });
  });

  it('registers the team name confirmation as a native form sheet', () => {
    render(<RallyeStackLayout />);

    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'team-name-sheet',
        options: expect.objectContaining({
          contentStyle: { backgroundColor: 'transparent' },
          headerShown: false,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.22],
          sheetGrabberVisible: true,
        }),
      }),
      undefined
    );
  });

  it('clears rallye session on unmount after logout disables navigation', () => {
    const { unmount } = render(<RallyeStackLayout />);

    mockEnabled = false;
    unmount();

    expect(store$.clearRallyeSession).toHaveBeenCalledTimes(1);
  });

  it('does not clear rallye session during regular unmounts', () => {
    const { unmount } = render(<RallyeStackLayout />);

    unmount();

    expect(store$.clearRallyeSession).not.toHaveBeenCalled();
  });
});
