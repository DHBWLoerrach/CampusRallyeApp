import React from 'react';
import { render } from '@testing-library/react-native';
import UIButton from '../UIButton';

describe('UIButton', () => {
  it('renders label text', () => {
    const { getByText } = render(<UIButton>Continue</UIButton>);
    expect(getByText('Continue')).toBeTruthy();
  });
});
