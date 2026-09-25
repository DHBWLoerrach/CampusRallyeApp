import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import InfoBox from '../InfoBox';
import { ThemeContext } from '@/utils/ThemeContext';

const darkWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider
    value={{ isDarkMode: true, mode: 'dark', setMode: jest.fn() }}
  >
    {children}
  </ThemeContext.Provider>
);

describe('InfoBox', () => {
  it('keeps a caller-provided border in dark mode', () => {
    const { getByTestId } = render(
      <InfoBox testID="box" style={{ borderColor: 'red', borderWidth: 2 }} />,
      { wrapper: darkWrapper }
    );

    const style = StyleSheet.flatten(getByTestId('box').props.style);
    expect(style.borderColor).toBe('red');
    expect(style.borderWidth).toBe(2);
  });

  it('removes caller-provided shadows in dark mode', () => {
    const { getByTestId } = render(
      <InfoBox testID="box" style={{ shadowOpacity: 0.25, elevation: 5 }} />,
      { wrapper: darkWrapper }
    );

    const style = StyleSheet.flatten(getByTestId('box').props.style);
    expect(style.shadowOpacity).toBe(0);
    expect(style.elevation).toBe(0);
  });
});
