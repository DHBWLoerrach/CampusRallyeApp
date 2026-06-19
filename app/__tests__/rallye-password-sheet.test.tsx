import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import RallyePasswordSheetRoute from '../rallye-password-sheet';
import {
  clearRallyePasswordSheetSession,
  getRallyePasswordSheetSession,
  setRallyePasswordSheetSession,
} from '@/services/rallyePasswordSheetSession';
import type { RallyeRow } from '@/services/storage/rallyeStorage';

const mockRouterBack = jest.fn();
const mockRouterCanGoBack = jest.fn(() => true);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
    canGoBack: mockRouterCanGoBack,
  }),
}));

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
  name: 'Protected Campus Rallye',
  status: 'running',
  password: 'secret',
  mode: 'department',
  end_time: null,
};

describe('RallyePasswordSheetRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRallyePasswordSheetSession();
    mockRouterCanGoBack.mockReturnValue(true);
  });

  afterEach(() => {
    clearRallyePasswordSheetSession();
  });

  it('dismisses itself when opened without a pending session', () => {
    render(<RallyePasswordSheetRoute />);

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it('joins through the pending session without navigating back', async () => {
    const onJoin = jest.fn().mockResolvedValue(true);
    setRallyePasswordSheetSession({
      rallye: protectedRallye,
      onJoin,
    });

    const { getByLabelText, getByText, unmount } = render(
      <RallyePasswordSheetRoute />
    );

    fireEvent.changeText(getByLabelText('rallye.password.label'), 'secret');
    await act(async () => {
      fireEvent.press(getByText('rallye.password.join'));
    });

    expect(onJoin).toHaveBeenCalledWith(protectedRallye);
    expect(mockRouterBack).not.toHaveBeenCalled();

    unmount();
    expect(getRallyePasswordSheetSession()).toBeNull();
  });

  it('keeps the sheet retryable when join fails', async () => {
    const onJoin = jest.fn().mockResolvedValue(false);
    setRallyePasswordSheetSession({
      rallye: protectedRallye,
      onJoin,
    });

    const { getByLabelText, getByText } = render(<RallyePasswordSheetRoute />);

    fireEvent.changeText(getByLabelText('rallye.password.label'), 'secret');
    await act(async () => {
      fireEvent.press(getByText('rallye.password.join'));
    });
    await act(async () => {
      fireEvent.press(getByText('rallye.password.join'));
    });

    expect(onJoin).toHaveBeenCalledTimes(2);
    expect(mockRouterBack).not.toHaveBeenCalled();
  });

  it('does not dismiss while a join is pending', async () => {
    let resolveJoin: (value: boolean) => void = () => {};
    const onJoin = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveJoin = resolve;
        })
    );
    setRallyePasswordSheetSession({
      rallye: protectedRallye,
      onJoin,
    });

    const { getByLabelText, getByText } = render(<RallyePasswordSheetRoute />);

    fireEvent.changeText(getByLabelText('rallye.password.label'), 'secret');
    await act(async () => {
      fireEvent.press(getByText('rallye.password.join'));
    });
    fireEvent.press(getByText('common.cancel'));

    expect(mockRouterBack).not.toHaveBeenCalled();

    await act(async () => {
      resolveJoin(false);
    });
  });
});
