import React from 'react';
import { render } from '@testing-library/react-native';
import PlannedEndInfo from '../PlannedEndInfo';

let mockLanguage: 'de' | 'en' = 'de';

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    language: mockLanguage,
    t: (key: string, params?: Record<string, unknown>) =>
      key === 'rallye.plannedEnd'
        ? mockLanguage === 'de'
          ? `geplant bis ${params?.time} Uhr`
          : `planned until ${params?.time}`
        : key,
  }),
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => null,
}));

describe('PlannedEndInfo', () => {
  beforeEach(() => {
    mockLanguage = 'de';
  });

  it('renders nothing when there is no planned end time', async () => {
    const { toJSON } = await render(<PlannedEndInfo endTime={null} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when endTime is undefined', async () => {
    const { toJSON } = await render(<PlannedEndInfo endTime={undefined} />);
    expect(toJSON()).toBeNull();
  });

  it('shows the planned end time as calm orientation text', async () => {
    const endTime = '14:30:00';
    const { getByText } = await render(<PlannedEndInfo endTime={endTime} />);

    expect(getByText('geplant bis 14:30 Uhr')).toBeTruthy();
  });

  it('normalizes PostgreSQL midnight boundary time for both languages', async () => {
    const german = await render(<PlannedEndInfo endTime="24:00:00" />);
    expect(german.getByText('geplant bis 00:00 Uhr')).toBeTruthy();

    mockLanguage = 'en';
    const english = await render(<PlannedEndInfo endTime="24:00:00" />);
    expect(english.getByText('planned until 12:00 AM')).toBeTruthy();
  });
});
