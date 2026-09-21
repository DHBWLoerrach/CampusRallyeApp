import React from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import QRCodeQuestion from '../QRCodeQuestion';
import type { Question } from '@/types/rallye';

const mockSubmitAnswerAndAdvance = jest.fn();
jest.mock('@/services/storage/answerSubmission', () => ({
  submitAnswerAndAdvance: (...args: unknown[]) =>
    mockSubmitAnswerAndAdvance(...args),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { get: jest.fn(() => ({ id: 1 })) },
    answers: { get: jest.fn(() => []) },
    isTourMode: { get: jest.fn(() => false) },
  },
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ screen: {}, text: {} }),
}));

jest.mock('@/utils/ConfirmAlert', () => ({
  confirm: jest.fn(() => Promise.resolve(true)),
}));

type CameraPermission = { granted: boolean; canAskAgain: boolean };
type PermissionMethod = () => Promise<CameraPermission>;

const mockUseCameraPermissions = jest.fn<
  [CameraPermission, PermissionMethod, PermissionMethod?],
  []
>(() => [{ granted: true, canAskAgain: true }, jest.fn()]);
jest.mock('expo-camera', () => {
  const ReactActual = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    CameraView: ReactActual.forwardRef(
      (props: Record<string, unknown>, _ref: unknown) => (
        <View testID="camera-view" {...props} />
      )
    ),
    useCameraPermissions: () => mockUseCameraPermissions(),
  };
});

jest.mock('@/components/themed/ThemedView', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/themed/ThemedText', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
  };
});

jest.mock('@/components/ui/UIButton', () => {
  const { Text, Pressable } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      onPress,
      disabled,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      disabled?: boolean;
    }) => (
      <Pressable onPress={disabled ? undefined : onPress} disabled={disabled}>
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/components/ui/Hint', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <View />,
  };
});

jest.mock('@/components/ui/InfoBox', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/ui/VStack', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

const baseQuestion: Question = {
  id: 42,
  question: 'Scan the hidden marker',
  question_type: 'qr_code',
  point_value: 10,
};

describe('QRCodeQuestion', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(),
    ]);
    const storeMock = jest.requireMock('@/services/storage/Store');
    storeMock.store$.answers.get.mockReturnValue([
      { question_id: 42, text: 'secret code', correct: true },
    ]);
    storeMock.store$.isTourMode.get.mockReturnValue(false);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('allows surrender when camera access is denied', async () => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      jest.fn(),
    ]);
    mockSubmitAnswerAndAdvance.mockResolvedValue({ status: 'sent' });

    const { getByText } = render(<QRCodeQuestion question={baseQuestion} />);

    expect(getByText('Scan the hidden marker')).toBeTruthy();
    expect(getByText('question.camera.needAccess')).toBeTruthy();

    fireEvent.press(getByText('common.surrender'));

    await waitFor(() => {
      expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 1,
          questionId: 42,
          pointsAwarded: 0,
          isCorrect: false,
        })
      );
    });
  });

  it('can scan after camera access is granted in settings', async () => {
    let appStateListener: ((state: AppStateStatus) => void) | undefined;
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, listener) => {
        appStateListener = listener;
        return { remove: jest.fn() };
      });

    let systemPermission = { granted: false, canAskAgain: false };
    function usePermissionsAfterSettings(): [
      CameraPermission,
      PermissionMethod,
      PermissionMethod,
    ] {
      const [permission, setPermission] = React.useState(systemPermission);
      const requestPermission = React.useCallback(
        async () => systemPermission,
        []
      );
      const getPermission = React.useCallback(async () => {
        setPermission(systemPermission);
        return systemPermission;
      }, []);
      return [permission, requestPermission, getPermission];
    }
    mockUseCameraPermissions.mockImplementation(usePermissionsAfterSettings);

    const { getByText, getByTestId, queryByText } = render(
      <QRCodeQuestion question={baseQuestion} />
    );
    expect(getByText('question.camera.openSettings')).toBeTruthy();

    appStateListener?.('background');
    systemPermission = { granted: true, canAskAgain: true };
    await act(async () => {
      appStateListener?.('active');
    });

    expect(getByText('question.qr.scan')).toBeTruthy();
    expect(queryByText('question.camera.openSettings')).toBeNull();
    fireEvent.press(getByText('question.qr.scan'));
    expect(getByTestId('camera-view')).toBeTruthy();
  });

  it('accepts scanned QR values with trailing whitespace', async () => {
    const { getByText, getByTestId } = render(
      <QRCodeQuestion question={baseQuestion} />
    );

    fireEvent.press(getByText('question.qr.scan'));
    fireEvent(getByTestId('camera-view'), 'onBarcodeScanned', {
      data: 'Secret Code \n',
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'common.ok',
        'question.qr.correctMessage',
        expect.any(Array)
      );
    });

    const buttons = alertSpy.mock.calls.at(-1)?.[2] as
      { onPress?: () => void }[] | undefined;
    buttons?.[0]?.onPress?.();

    await waitFor(() => {
      expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: 1,
        questionId: 42,
        pointsAwarded: 10,
        isCorrect: true,
      });
    });
  });

  it('submits a correct tour QR scan without the old success alert', async () => {
    const storeMock = jest.requireMock('@/services/storage/Store');
    storeMock.store$.isTourMode.get.mockReturnValue(true);
    const { getByText, getByTestId } = render(
      <QRCodeQuestion question={baseQuestion} />
    );

    fireEvent.press(getByText('question.qr.scan'));
    fireEvent(getByTestId('camera-view'), 'onBarcodeScanned', {
      data: 'secret code',
    });

    await waitFor(() => {
      expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: true, questionId: 42 })
      );
    });
    expect(alertSpy).not.toHaveBeenCalledWith(
      'common.ok',
      'question.qr.correctMessage',
      expect.any(Array)
    );
  });

  it('keeps the QR scan lock active while a successful submit is still in flight', async () => {
    jest.useFakeTimers();
    let resolveSubmit: (value: { status: 'sent' }) => void = () => {};
    mockSubmitAnswerAndAdvance.mockImplementation(
      () =>
        new Promise<{ status: 'sent' }>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    const { getByText, getByTestId } = render(
      <QRCodeQuestion question={baseQuestion} />
    );

    fireEvent.press(getByText('question.qr.scan'));
    fireEvent(getByTestId('camera-view'), 'onBarcodeScanned', {
      data: 'secret code',
    });

    const successButtons = alertSpy.mock.calls.at(-1)?.[2] as
      { onPress?: () => void }[] | undefined;
    successButtons?.[0]?.onPress?.();

    act(() => {
      jest.advanceTimersByTime(2_000);
    });

    fireEvent.press(getByText('question.qr.scan'));
    fireEvent(getByTestId('camera-view'), 'onBarcodeScanned', {
      data: 'secret code',
    });

    const successAlerts = alertSpy.mock.calls.filter(
      ([title, message]) =>
        title === 'common.ok' && message === 'question.qr.correctMessage'
    );
    expect(successAlerts).toHaveLength(1);

    resolveSubmit({ status: 'sent' });
  });
});
