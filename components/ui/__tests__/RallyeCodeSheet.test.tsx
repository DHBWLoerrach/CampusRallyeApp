import React from 'react';
import { Alert, Keyboard, ScrollView, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import RallyeCodeSheet, {
  isRallyeCodeRequired,
} from '@/components/ui/RallyeCodeSheet';
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
  rallye_code: 'secret',
  mode: 'department',
  rallye_end: null,
};

describe('RallyeCodeSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('detects whether a rallye code is required', () => {
    expect(isRallyeCodeRequired(protectedRallye)).toBe(true);
    expect(isRallyeCodeRequired({ rallye_code: '   ' })).toBe(false);
    expect(isRallyeCodeRequired(null)).toBe(false);
  });

  it('truncates long rallye titles in the sheet content', () => {
    const { getByText } = render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    expect(getByText(protectedRallye.name).props.numberOfLines).toBe(2);
  });

  it('shows the subtitle explaining the code entry', () => {
    const { getByText } = render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    expect(getByText('rallye.code.subtitle')).toBeTruthy();
  });

  it('renders the code input unmasked', () => {
    const { getByLabelText } = render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    expect(getByLabelText('rallye.code.label').props.secureTextEntry).toBeFalsy();
  });

  it('keeps the content scrollable when the keyboard reduces available space', () => {
    const { UNSAFE_getByType } = render(
      <RallyeCodeSheet
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
      <RallyeCodeSheet
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
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={onClose}
        onJoin={jest.fn()}
      />
    );

    fireEvent.press(UNSAFE_getByProps({ testID: 'rallye-code-backdrop' }));

    expect(dismissSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an alert when submitting without a code', () => {
    const onJoin = jest.fn();
    const { getByText } = render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={onJoin}
      />
    );

    fireEvent.press(getByText('rallye.code.join'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'rallye.code.missing.title',
      'rallye.code.missing.message'
    );
    expect(onJoin).not.toHaveBeenCalled();
  });

  it('shows an alert when the code is wrong', () => {
    const onJoin = jest.fn();
    const { getByLabelText, getByText } = render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={onJoin}
      />
    );

    fireEvent.changeText(getByLabelText('rallye.code.label'), 'wrong');
    fireEvent.press(getByText('rallye.code.join'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'rallye.code.wrong.title',
      'rallye.code.wrong.message'
    );
    expect(onJoin).not.toHaveBeenCalled();
  });

  it('joins without closing itself when the code is correct', async () => {
    const onClose = jest.fn();
    const onJoin = jest.fn().mockResolvedValue(true);
    const { getByLabelText, getByText } = render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={onClose}
        onJoin={onJoin}
      />
    );

    fireEvent.changeText(getByLabelText('rallye.code.label'), 'secret');
    await act(async () => {
      fireEvent.press(getByText('rallye.code.join'));
    });

    expect(onJoin).toHaveBeenCalledWith(protectedRallye);
    expect(onClose).not.toHaveBeenCalled();
  });
});
