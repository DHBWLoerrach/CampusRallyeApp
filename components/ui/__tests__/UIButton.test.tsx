import React from 'react';
import { render } from '@testing-library/react-native';
import UIButton from '../UIButton';
import { ThemeContext } from '@/utils/ThemeContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={{ isDarkMode: false, mode: 'light', setMode: jest.fn() }}>
    {children}
  </ThemeContext.Provider>
);

describe('UIButton', () => {
  it('renders label text', () => {
    const { getByText } = render(<UIButton>Continue</UIButton>, { wrapper });
    expect(getByText('Continue')).toBeTruthy();
  });
});
