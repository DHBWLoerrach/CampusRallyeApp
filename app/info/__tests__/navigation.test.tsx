import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import WelcomeInfos from '../index';
import WelcomeInfosLayout from '../_layout';
import TabInfos from '../../(tabs)/infos';
import Imprint from '../imprint';
import About from '../about';
import type { Language, TranslationKey } from '@/utils/i18n';

type HeaderLeftProps = Record<string, unknown>;

type StackScreenOptions = {
  title?: string;
  headerLeft?: (props: HeaderLeftProps) => React.ReactNode;
};

type StackProps = {
  children: React.ReactNode;
};

type StackScreenProps = {
  name: string;
  options?: StackScreenOptions;
};

type HeaderBackButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;
let mockLanguage: Language = 'de';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => mockCanGoBack,
  }),
  Stack: Object.assign(({ children }: StackProps) => children, {
    Screen: ({ options }: StackScreenProps) =>
      options?.headerLeft?.({}) ?? null,
  }),
}));

jest.mock('expo-router/react-navigation', () => ({
  HeaderBackButton: ({
    onPress,
    accessibilityLabel,
  }: HeaderBackButtonProps) => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{accessibilityLabel}</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/components/ui/Screen', () => ({
  ScreenScrollView: ({ children }: { children: React.ReactNode }) => {
    const { View } = jest.requireActual('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => null,
}));

jest.mock('@/utils/LanguageContext', () => {
  const { translations } =
    jest.requireActual<typeof import('@/utils/i18n')>('@/utils/i18n');
  return {
    useLanguage: () => ({
      language: mockLanguage,
      t: (key: TranslationKey) => translations[mockLanguage][key],
    }),
  };
});

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe('Welcome info navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack = true;
    mockLanguage = 'de';
  });

  it.each([
    ['de', 'Impressum', 'Über diese App'],
    ['en', 'Imprint', 'About this app'],
  ] as const)(
    'opens the public detail routes in %s',
    (language, imprint, about) => {
      mockLanguage = language;
      const { getByRole } = render(<WelcomeInfos />);

      fireEvent.press(getByRole('button', { name: imprint }));
      expect(mockPush).toHaveBeenLastCalledWith('/info/imprint');

      fireEvent.press(getByRole('button', { name: about }));
      expect(mockPush).toHaveBeenLastCalledWith('/info/about');
    }
  );

  it('keeps the existing info tab links inside the rallye tabs', () => {
    const { getByRole } = render(<TabInfos />);

    fireEvent.press(getByRole('button', { name: 'Impressum' }));
    expect(mockPush).toHaveBeenLastCalledWith('/infos/imprint');

    fireEvent.press(getByRole('button', { name: 'Über diese App' }));
    expect(mockPush).toHaveBeenLastCalledWith('/infos/about');
  });

  it('pops back to the existing welcome screen', () => {
    const { getByRole } = render(<WelcomeInfosLayout />);

    fireEvent.press(getByRole('button', { name: 'Zurück' }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns to welcome when opened without navigation history', () => {
    mockCanGoBack = false;
    const { getByRole } = render(<WelcomeInfosLayout />);

    fireEvent.press(getByRole('button', { name: 'Zurück' }));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('renders imprint content without participation or network access', () => {
    const { getByText } = render(<Imprint />);

    expect(
      getByText('Duale Hochschule Baden-Württemberg Lörrach')
    ).toBeTruthy();
  });

  it('renders project information without participation or network access', () => {
    const { getByText } = render(<About />);

    expect(getByText('Campus Rallye App der DHBW Lörrach')).toBeTruthy();
  });
});
