import React from 'react';
import { Alert, Keyboard, ScrollView, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import RallyePasswordSheet, {
  isPasswordRequired,
} from '@/components/ui/RallyePasswordSheet';
import type { RallyeRow } from '@/services/storage/rallyeStorage';

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

const protectedRallye: RallyeRow = {
  id: 1,
  name: 'Protected Campus Rallye With A Rather Long Title',
  department_id: 1,
  status: 'running',
  password: 'secret',
  mode: 'department',
  end_time: null,
};

describe('RallyePasswordSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('detects whether a password is required', () => {
    expect(isPasswordRequired(protectedRallye)).toBe(true);
    expect(isPasswordRequired({ password: '   ' })).toBe(false);
    expect(isPasswordRequired(null)).toBe(false);
  });

  it('truncates long rallye titles in the sheet content', () => {
    const { getByText } = render(
      <RallyePasswordSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    expect(getByText(protectedRallye.name).props.numberOfLines).toBe(2);
  });

  it('keeps the content scrollable when the keyboard reduces available space', () => {
    const { UNSAFE_getByType } = render(
      <RallyePasswordSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    const scrollView = UNSAFE_getByType(ScrollView);
    expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
    expect(scrollView.props.automaticallyAdjustKeyboardInsets).toBe(true);
  });

  it('marks the card as modal content for accessibility', () => {
    const { UNSAFE_getAllByType } = render(
      <RallyePasswordSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    const modalCard = UNSAFE_getAllByType(View).find(
      (view) => view.props.accessibilityViewIsModal === true
    );
    expect(modalCard?.props.importantForAccessibility).toBe('yes');
  });

  it('dismisses the keyboard before closing from the backdrop', () => {
    const onClose = jest.fn();
    const dismissSpy = jest
      .spyOn(Keyboard, 'dismiss')
      .mockImplementation(() => undefined);
    const { UNSAFE_getByProps } = render(
      <RallyePasswordSheet
        rallye={protectedRallye}
        onClose={onClose}
        onJoin={jest.fn()}
      />
    );

    fireEvent.press(UNSAFE_getByProps({ testID: 'rallye-password-backdrop' }));

    expect(dismissSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an alert when submitting without a password', () => {
    const onJoin = jest.fn();
    const { getByText } = render(
      <RallyePasswordSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={onJoin}
      />
    );

    fireEvent.press(getByText('rallye.password.join'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'rallye.password.missing.title',
      'rallye.password.missing.message'
    );
    expect(onJoin).not.toHaveBeenCalled();
  });

  it('shows an alert when the password is wrong', () => {
    const onJoin = jest.fn();
    const { getByLabelText, getByText } = render(
      <RallyePasswordSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={onJoin}
      />
    );

    fireEvent.changeText(getByLabelText('rallye.password.label'), 'wrong');
    fireEvent.press(getByText('rallye.password.join'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'rallye.password.wrong.title',
      'rallye.password.wrong.message'
    );
    expect(onJoin).not.toHaveBeenCalled();
  });

  it('joins without closing itself when the password is correct', async () => {
    const onClose = jest.fn();
    const onJoin = jest.fn().mockResolvedValue(true);
    const { getByLabelText, getByText } = render(
      <RallyePasswordSheet
        rallye={protectedRallye}
        onClose={onClose}
        onJoin={onJoin}
      />
    );

    fireEvent.changeText(getByLabelText('rallye.password.label'), 'secret');
    await act(async () => {
      fireEvent.press(getByText('rallye.password.join'));
    });

    expect(onJoin).toHaveBeenCalledWith(protectedRallye);
    expect(onClose).not.toHaveBeenCalled();
  });
});
