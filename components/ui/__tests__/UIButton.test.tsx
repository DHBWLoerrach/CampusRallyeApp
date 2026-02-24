import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UIButton from '../UIButton';
import { ThemeContext } from '@/utils/ThemeContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider
    value={{ isDarkMode: false, mode: 'light', setMode: jest.fn() }}
  >
    {children}
  </ThemeContext.Provider>
);

describe('UIButton', () => {
  it('renders label text', () => {
    const { getByText } = render(<UIButton>Continue</UIButton>, { wrapper });
    expect(getByText('Continue')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <UIButton onPress={onPress}>Click me</UIButton>,
      { wrapper }
    );

    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <UIButton onPress={onPress} disabled>
        Disabled
      </UIButton>,
      { wrapper }
    );

    const button = getByRole('button');
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <UIButton onPress={onPress} loading>
        Loading
      </UIButton>,
      { wrapper }
    );

    const button = getByRole('button');
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes disabled and busy accessibility state when loading', () => {
    const { getByRole } = render(
      <UIButton loading>Saving</UIButton>,
      { wrapper }
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true, busy: true })
    );
  });

  it('passes accessibilityLabel and accessibilityHint', () => {
    const { getByRole } = render(
      <UIButton accessibilityLabel="Submit form" accessibilityHint="Sends answer">
        Submit
      </UIButton>,
      { wrapper }
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Submit form');
    expect(button.props.accessibilityHint).toBe('Sends answer');
  });

  it('applies reduced opacity when disabled', () => {
    const { getByRole } = render(
      <UIButton disabled>Off</UIButton>,
      { wrapper }
    );

    const button = getByRole('button');
    // Style is a function of pressed state; check that disabled sets opacity 0.55
    const styles = button.props.style;
    const flatStyles = Array.isArray(styles) ? styles : [styles];
    const hasReducedOpacity = flatStyles.some(
      (s: any) => s && s.opacity === 0.55
    );
    expect(hasReducedOpacity).toBe(true);
  });
});
