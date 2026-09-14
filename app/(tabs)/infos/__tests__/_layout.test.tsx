import React from 'react';
import { render } from '@testing-library/react-native';
import InfosStackLayout from '../_layout';
import type { Language, TranslationKey } from '@/utils/i18n';

type StackProps = {
  children: React.ReactNode;
};

type StackScreenProps = {
  name: string;
  options?: { title?: string };
};

let mockLanguage: Language = 'de';

jest.mock('expo-router', () => ({
  Stack: Object.assign(({ children }: StackProps) => children, {
    Screen: ({ options }: StackScreenProps) => {
      const { Text } = jest.requireActual('react-native');
      return <Text>{options?.title}</Text>;
    },
  }),
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

describe('InfosStackLayout', () => {
  beforeEach(() => {
    mockLanguage = 'de';
  });

  it.each([
    ['de', ['Infos', 'Impressum', 'Über diese App']],
    ['en', ['Info', 'Imprint', 'About this app']],
  ] as const)('localizes the info stack titles in %s', (language, titles) => {
    mockLanguage = language;
    const { getByText } = render(<InfosStackLayout />);

    titles.forEach((title) => {
      expect(getByText(title)).toBeTruthy();
    });
  });
});
