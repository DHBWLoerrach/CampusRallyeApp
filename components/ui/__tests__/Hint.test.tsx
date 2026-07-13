import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Hint from '../Hint';
import { confirm } from '@/utils/ConfirmAlert';

const mockMarkHintUsed = jest.fn();
const mockUsedHintGet = jest.fn(() => false);
const mockUsedHintSet = jest.fn();
const mockPointsSet = jest.fn();
const mockRallyeGet = jest.fn(() => ({ id: 10 }));
const mockTeamGet = jest.fn((): { id: number } | null => ({ id: 20 }));

jest.mock('@/services/storage/hintStorage', () => ({
  HINT_COST: 1,
  markHintUsed: (...args: unknown[]) => mockMarkHintUsed(...args),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    currentQuestion: { get: jest.fn(() => ({ id: 30 })) },
    rallye: { get: () => mockRallyeGet() },
    team: { get: () => mockTeamGet() },
    usedHints: {
      30: {
        get: () => mockUsedHintGet(),
        set: (value: boolean) => mockUsedHintSet(value),
      },
    },
    points: {
      get: jest.fn(() => 5),
      set: (value: number) => mockPointsSet(value),
    },
  },
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/utils/ConfirmAlert', () => ({
  confirm: jest.fn(),
}));

jest.mock('@react-native-vector-icons/material-icons', () =>
  jest.fn(() => null)
);

const mockedConfirm = jest.mocked(confirm);

describe('Hint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsedHintGet.mockReturnValue(false);
    mockRallyeGet.mockReturnValue({ id: 10 });
    mockTeamGet.mockReturnValue({ id: 20 });
    mockMarkHintUsed.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not persist or reveal when confirmation is cancelled', async () => {
    mockedConfirm.mockResolvedValue(false);
    const { getByRole } = render(<Hint hint="Secret hint" />);

    fireEvent.press(getByRole('button'));

    await waitFor(() => expect(mockedConfirm).toHaveBeenCalledTimes(1));
    expect(mockMarkHintUsed).not.toHaveBeenCalled();
    expect(mockUsedHintSet).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('persists the full scope before revealing a hint for the first time', async () => {
    mockedConfirm.mockResolvedValue(true);
    const { getByRole } = render(<Hint hint="Secret hint" />);

    fireEvent.press(getByRole('button'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('hint.title', 'Secret hint')
    );
    expect(mockMarkHintUsed).toHaveBeenCalledWith({
      rallyeId: 10,
      teamId: 20,
      questionId: 30,
    });
    expect(mockUsedHintSet).toHaveBeenCalledWith(true);
    expect(mockMarkHintUsed.mock.invocationCallOrder[0]).toBeLessThan(
      (Alert.alert as jest.Mock).mock.invocationCallOrder[0]
    );
  });

  it('reveals an already-used hint without another confirmation or write', async () => {
    mockUsedHintGet.mockReturnValue(true);
    const { getByRole } = render(<Hint hint="Secret hint" />);

    fireEvent.press(getByRole('button'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('hint.title', 'Secret hint')
    );
    expect(mockedConfirm).not.toHaveBeenCalled();
    expect(mockMarkHintUsed).not.toHaveBeenCalled();
  });

  it('keeps hint usage session-local in tour mode', async () => {
    mockTeamGet.mockReturnValue(null);
    mockedConfirm.mockResolvedValue(true);
    const { getByRole } = render(<Hint hint="Secret hint" />);

    fireEvent.press(getByRole('button'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('hint.title', 'Secret hint')
    );
    expect(mockMarkHintUsed).not.toHaveBeenCalled();
    expect(mockUsedHintSet).toHaveBeenCalledWith(true);
  });

  it('shows a localized error without revealing or marking on persistence failure', async () => {
    mockedConfirm.mockResolvedValue(true);
    mockMarkHintUsed.mockRejectedValue(new Error('storage unavailable'));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { getByRole } = render(<Hint hint="Secret hint" />);

    fireEvent.press(getByRole('button'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'common.errorTitle',
        'hint.error.save'
      )
    );
    expect(mockUsedHintSet).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalledWith('hint.title', 'Secret hint');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('does not mutate the accumulated point total directly', async () => {
    mockedConfirm.mockResolvedValue(true);
    const { getByRole } = render(<Hint hint="Secret hint" />);

    fireEvent.press(getByRole('button'));

    await waitFor(() => expect(mockUsedHintSet).toHaveBeenCalledWith(true));
    expect(mockPointsSet).not.toHaveBeenCalled();
  });
});
