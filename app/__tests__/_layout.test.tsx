import React, * as MockReact from 'react';
import { Pressable as MockPressable, Text as MockText } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import RootLayout from '../_layout';
import { store$ } from '@/services/storage/Store';

type StackProps = {
  children: React.ReactNode;
};

type StackScreenProps = {
  children?: React.ReactNode;
  name: string;
  options?: Record<string, unknown>;
};

const mockRouterReplace = jest.fn();
let mockErrorBoundaryError: Error | null = null;
const mockErrorBoundaryReset = jest.fn();

jest.mock('expo-router', () => ({
  Stack: Object.assign(
    jest.fn(({ children }: StackProps) => children),
    {
      Screen: jest.fn(({ children }: StackScreenProps) => children ?? null),
    }
  ),
  useRootNavigationState: () => ({ key: 'root' }),
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
  useSegments: () => [],
}));

jest.mock('expo-router/react-navigation', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(async () => undefined),
  preventAutoHideAsync: jest.fn(async () => undefined),
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    clearRallyeSession: jest.fn(),
    currentQuestion: { get: jest.fn(() => null) },
    enabled: { get: jest.fn(() => false) },
    hydrated: { get: jest.fn(() => true) },
    leaveRallye: jest.fn(),
    question: { get: jest.fn(() => null) },
    rallye: { get: jest.fn(() => null) },
    team: { get: jest.fn(() => null) },
  },
}));

jest.mock('@/utils/ThemeContext', () => {
  return {
    ThemeContext: MockReact.createContext({
      isDarkMode: false,
      mode: 'light',
      setMode: jest.fn(),
    }),
    themeStore$: {
      mode: {
        get: jest.fn(() => 'light'),
        set: jest.fn(),
      },
    },
    useTheme: () => ({ isDarkMode: false }),
  };
});

jest.mock('@/utils/LanguageContext', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/utils/navigationTheme', () => ({
  createNavigationTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ muted: {}, text: {} }),
}));

jest.mock('@/components/themed/ThemedText', () => {
  return function MockThemedText({ children }: { children: React.ReactNode }) {
    return <MockText>{children}</MockText>;
  };
});

jest.mock('@/components/ui/UIButton', () => {
  return function MockUIButton({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) {
    return (
      <MockPressable onPress={onPress}>
        <MockText>{children}</MockText>
      </MockPressable>
    );
  };
});

jest.mock('@/components/ui/ErrorBoundary', () => ({
  __esModule: true,
  default: ({
    children,
    fallback,
  }: {
    children: React.ReactNode;
    fallback: (props: { error: Error; reset: () => void }) => React.ReactNode;
  }) =>
    mockErrorBoundaryError
      ? fallback({
          error: mockErrorBoundaryError,
          reset: mockErrorBoundaryReset,
        })
      : children,
}));

const mockStackScreen = Stack.Screen as unknown as jest.Mock;

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockErrorBoundaryError = null;
  });

  it('registers the rallye code entry as a transparent modal instead of a form sheet', () => {
    render(<RootLayout />);

    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'rallye-code-sheet',
        options: expect.objectContaining({
          contentStyle: { backgroundColor: 'transparent' },
          gestureEnabled: false,
          presentation: 'transparentModal',
        }),
      }),
      undefined
    );

    const codeScreenOptions = mockStackScreen.mock.calls.find(
      ([props]) => props.name === 'rallye-code-sheet'
    )?.[0].options;

    expect(codeScreenOptions).not.toHaveProperty('sheetAllowedDetents');
    expect(codeScreenOptions).not.toHaveProperty('sheetGrabberVisible');
  });

  it('clears rallye session state when recovering from the error fallback', async () => {
    mockErrorBoundaryError = new Error('boom');

    const { getByText } = render(<RootLayout />);
    fireEvent.press(getByText('rallye.backToStart'));

    await waitFor(() => {
      expect(store$.leaveRallye).toHaveBeenCalledTimes(1);
      expect(store$.clearRallyeSession).toHaveBeenCalledTimes(1);
      expect(mockErrorBoundaryReset).toHaveBeenCalledTimes(1);
      expect(mockRouterReplace).toHaveBeenCalledWith('/');
    });
  });
});
