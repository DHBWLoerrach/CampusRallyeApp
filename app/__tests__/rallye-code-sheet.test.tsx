import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import RallyeCodeSheetRoute from '../rallye-code-sheet';
import {
  clearRallyeCodeSheetSession,
  getRallyeCodeSheetSession,
  setRallyeCodeSheetSession,
} from '@/services/rallyeCodeSheetSession';
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
  department_id: 1,
  status: 'running',
  rallye_code: 'secret',
  mode: 'department',
  rallye_end: null,
};

describe('RallyeCodeSheetRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRallyeCodeSheetSession();
    mockRouterCanGoBack.mockReturnValue(true);
  });

  afterEach(() => {
    clearRallyeCodeSheetSession();
  });

  it('dismisses itself when opened without a pending session', () => {
    render(<RallyeCodeSheetRoute />);

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it('joins through the pending session without navigating back', async () => {
    const onJoin = jest.fn().mockResolvedValue(true);
    setRallyeCodeSheetSession({
      rallye: protectedRallye,
      onJoin,
    });

    const { getByLabelText, getByText, unmount } = render(
      <RallyeCodeSheetRoute />
    );

    fireEvent.changeText(getByLabelText('rallye.code.label'), 'secret');
    await act(async () => {
      fireEvent.press(getByText('rallye.code.join'));
    });

    expect(onJoin).toHaveBeenCalledWith(protectedRallye);
    expect(mockRouterBack).not.toHaveBeenCalled();

    unmount();
    expect(getRallyeCodeSheetSession()).toBeNull();
  });

  it('keeps the sheet retryable when join fails', async () => {
    const onJoin = jest.fn().mockResolvedValue(false);
    setRallyeCodeSheetSession({
      rallye: protectedRallye,
      onJoin,
    });

    const { getByLabelText, getByText } = render(<RallyeCodeSheetRoute />);

    fireEvent.changeText(getByLabelText('rallye.code.label'), 'secret');
    await act(async () => {
      fireEvent.press(getByText('rallye.code.join'));
    });
    await act(async () => {
      fireEvent.press(getByText('rallye.code.join'));
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
    setRallyeCodeSheetSession({
      rallye: protectedRallye,
      onJoin,
    });

    const { getByLabelText, getByText } = render(<RallyeCodeSheetRoute />);

    fireEvent.changeText(getByLabelText('rallye.code.label'), 'secret');
    await act(async () => {
      fireEvent.press(getByText('rallye.code.join'));
    });
    fireEvent.press(getByText('common.cancel'));

    expect(mockRouterBack).not.toHaveBeenCalled();

    await act(async () => {
      resolveJoin(false);
    });
  });
});
