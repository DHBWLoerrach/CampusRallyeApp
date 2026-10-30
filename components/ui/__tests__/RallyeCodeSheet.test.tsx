import React from 'react';
import { Alert, Keyboard } from 'react-native';
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

  it('truncates long rallye titles in the sheet content', async () => {
    const { getByText } = await render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    expect(getByText(protectedRallye.name).props.numberOfLines).toBe(2);
  });

  it('shows the subtitle explaining the code entry', async () => {
    const { getByText } = await render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    expect(getByText('rallye.code.subtitle')).toBeTruthy();
  });

  it('renders the code input unmasked', async () => {
    const { getByLabelText } = await render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    expect(
      getByLabelText('rallye.code.label').props.secureTextEntry
    ).toBeFalsy();
  });

  it('keeps the content scrollable when the keyboard reduces available space', async () => {
    const { container } = await render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    const [scrollView] = container.queryAll(
      (node) => node.type === 'RCTScrollView'
    );
    expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
    expect(scrollView.props.automaticallyAdjustKeyboardInsets).toBe(true);
  });

  it('marks the card as modal content for accessibility', async () => {
    const { container } = await render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={jest.fn()}
      />
    );

    const [modalCard] = container.queryAll(
      (node) => node.props.accessibilityViewIsModal === true
    );
    expect(modalCard.props.importantForAccessibility).toBe('yes');
  });

  it('dismisses the keyboard before closing from the backdrop', async () => {
    const onClose = jest.fn();
    const dismissSpy = jest
      .spyOn(Keyboard, 'dismiss')
      .mockImplementation(() => undefined);
    const { getByTestId } = await render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={onClose}
        onJoin={jest.fn()}
      />
    );

    // The modal card hides its sibling backdrop from screen readers only.
    await fireEvent.press(
      getByTestId('rallye-code-backdrop', { includeHiddenElements: true })
    );

    expect(dismissSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an alert when submitting without a code', async () => {
    const onJoin = jest.fn();
    const { getByText } = await render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={onJoin}
      />
    );

    await fireEvent.press(getByText('rallye.code.join'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'rallye.code.missing.title',
      'rallye.code.missing.message'
    );
    expect(onJoin).not.toHaveBeenCalled();
  });

  it('shows an alert when the code is wrong', async () => {
    const onJoin = jest.fn();
    const { getByLabelText, getByText } = await render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={jest.fn()}
        onJoin={onJoin}
      />
    );

    await fireEvent.changeText(getByLabelText('rallye.code.label'), 'wrong');
    await fireEvent.press(getByText('rallye.code.join'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'rallye.code.wrong.title',
      'rallye.code.wrong.message'
    );
    expect(onJoin).not.toHaveBeenCalled();
  });

  it('joins without closing itself when the code is correct', async () => {
    const onClose = jest.fn();
    const onJoin = jest.fn().mockResolvedValue(true);
    const { getByLabelText, getByText } = await render(
      <RallyeCodeSheet
        rallye={protectedRallye}
        onClose={onClose}
        onJoin={onJoin}
      />
    );

    await fireEvent.changeText(getByLabelText('rallye.code.label'), 'secret');
    await act(async () => {
      await fireEvent.press(getByText('rallye.code.join'));
    });

    expect(onJoin).toHaveBeenCalledWith(protectedRallye);
    expect(onClose).not.toHaveBeenCalled();
  });
});
