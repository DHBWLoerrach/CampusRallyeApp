import React from 'react';
import { render } from '@testing-library/react-native';
import PlannedEndInfo from '../PlannedEndInfo';

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'de',
    t: (key: string, params?: Record<string, unknown>) =>
      key === 'rallye.plannedEnd' ? `geplant bis ${params?.time} Uhr` : key,
  }),
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => null,
}));

describe('PlannedEndInfo', () => {
  it('renders nothing when there is no planned end time', () => {
    const { toJSON } = render(<PlannedEndInfo endTime={null} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when endTime is undefined', () => {
    const { toJSON } = render(<PlannedEndInfo endTime={undefined} />);
    expect(toJSON()).toBeNull();
  });

  it('shows the planned end time as calm orientation text', () => {
    const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { getByText } = render(<PlannedEndInfo endTime={endTime} />);

    expect(getByText(/geplant bis .* Uhr/)).toBeTruthy();
  });
});
