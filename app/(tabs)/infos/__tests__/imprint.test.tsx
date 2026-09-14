import React from 'react';
import { render } from '@testing-library/react-native';
import Imprint from '../imprint';
import type { Language } from '@/utils/i18n';

type ScreenProps = {
  children: React.ReactNode;
};

type ThemedTextProps = {
  children: React.ReactNode;
  variant?: string;
};

jest.mock('@/components/ui/Screen', () => ({
  ScreenScrollView: ({ children }: ScreenProps) => {
    const { View } = jest.requireActual('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/components/themed/ThemedText', () => ({
  __esModule: true,
  default: ({ children, variant, ...rest }: ThemedTextProps) => {
    const { Text } = jest.requireActual('react-native');
    return <Text {...rest}>{children}</Text>;
  },
}));

let mockLanguage: Language = 'de';

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage }),
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe('Imprint info screen', () => {
  beforeEach(() => {
    mockLanguage = 'de';
  });

  it('renders the required imprint details in German', () => {
    const { getByText } = render(<Imprint />);

    expect(
      getByText('Duale Hochschule Baden-Württemberg Lörrach')
    ).toBeTruthy();
    expect(getByText('Aufsicht und Anbieter')).toBeTruthy();
    expect(getByText(/Martina Klärle/)).toBeTruthy();
    expect(getByText(/Gerhard Jäger/)).toBeTruthy();
    expect(getByText('Umsatzsteuer-Identifikationsnummer')).toBeTruthy();
    expect(getByText('DE287664832')).toBeTruthy();
    expect(getByText('Wirtschafts-Identifikationsnummer')).toBeTruthy();
    expect(getByText('DE287664832-00001')).toBeTruthy();
    expect(getByText('https://dhbw-loerrach.de')).toBeTruthy();
    expect(getByText('https://www.mwk.bwl.de')).toBeTruthy();
  });
});
