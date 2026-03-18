import React from 'react';
import { act, render } from '@testing-library/react-native';
import TimerHeader from '../TimerHeader';

jest.mock('@/services/storage/Store', () => ({
  store$: {
    timeExpired: { set: jest.fn() },
  },
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => null,
}));

describe('TimerHeader', () => {
  const storeMock = jest.requireMock('@/services/storage/Store') as {
    store$: { timeExpired: { set: jest.Mock } };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not mark rallyes without an end time as expired', () => {
    render(<TimerHeader endTime={null} />);

    act(() => {
      jest.advanceTimersByTime(2_000);
    });

    expect(storeMock.store$.timeExpired.set).not.toHaveBeenCalled();
  });

  it('marks already expired rallyes immediately on mount', () => {
    render(<TimerHeader endTime={new Date(Date.now() - 1_000).toISOString()} />);

    expect(storeMock.store$.timeExpired.set).toHaveBeenCalledWith(true);
  });
});
