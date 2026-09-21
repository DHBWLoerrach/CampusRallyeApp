import React from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import GeocachingQuestion from '../GeocachingQuestion';
import { Question } from '@/types/rallye';
import { confirm } from '@/utils/ConfirmAlert';
import { formatDistance, haversineDistance } from '@/utils/geo';

// -- Mocks -------------------------------------------------------------------

// Jest cannot evaluate the dynamic import used by the lazy compass.
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  lazy: () =>
    jest.requireMock('@/components/rallye/questions/Compass3DArrow').default,
}));

// Replace the 3D canvas component with a simple View so Jest doesn't need WebGL
jest.mock('@/components/rallye/questions/Compass3DArrow', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <View testID="compass-3d-arrow" />,
  };
});

const mockSubmitAnswerAndAdvance = jest.fn();
const mockGotoNextQuestion = jest.fn();
jest.mock('@/services/storage/answerSubmission', () => ({
  submitAnswerAndAdvance: (...args: unknown[]) =>
    mockSubmitAnswerAndAdvance(...args),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { get: jest.fn(() => ({ id: 1 })) },
    answers: { get: jest.fn(() => []) },
    isTourMode: { get: jest.fn(() => false) },
    gotoNextQuestion: (...args: unknown[]) => mockGotoNextQuestion(...args),
  },
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ text: {}, muted: {}, screen: {} }),
}));

jest.mock('@/utils/ConfirmAlert', () => ({
  confirmAnswer: jest.fn(() => Promise.resolve(true)),
  confirm: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/utils/useKeyboard', () => ({
  useKeyboard: () => ({ keyboardHeight: 0, keyboardVisible: false }),
}));

// Mock expo-location
const mockWatchPositionAsync = jest.fn();
const mockWatchHeadingAsync = jest.fn();
const mockGetCurrentPositionAsync = jest.fn();
const mockRequestForegroundPermissionsAsync = jest.fn();
const mockGetForegroundPermissionsAsync = jest.fn();
const mockDeviceMotionAddListener = jest.fn((_listener: unknown) => ({
  remove: jest.fn(),
}));
const mockDeviceMotionSetUpdateInterval = jest.fn((_interval: number) => {});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: (...args: unknown[]) =>
    mockRequestForegroundPermissionsAsync(...args),
  getForegroundPermissionsAsync: (...args: unknown[]) =>
    mockGetForegroundPermissionsAsync(...args),
  getCurrentPositionAsync: (...args: unknown[]) =>
    mockGetCurrentPositionAsync(...args),
  watchPositionAsync: (...args: unknown[]) => mockWatchPositionAsync(...args),
  watchHeadingAsync: (...args: unknown[]) => mockWatchHeadingAsync(...args),
  Accuracy: {
    Balanced: 3,
    BestForNavigation: 5,
  },
}));

// Mock expo-sensors (DeviceMotion)
jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    setUpdateInterval: (interval: number) =>
      mockDeviceMotionSetUpdateInterval(interval),
    addListener: (listener: unknown) => mockDeviceMotionAddListener(listener),
  },
}));

// Mock expo-camera
const mockUseCameraPermissions = jest.fn(() => [
  { granted: true, canAskAgain: true },
  jest.fn(),
]);
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

// Mock react-native-svg (calibration illustration still uses Path, Rect, Ellipse)
jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual('react-native');
  const mock = (name: string) => {
    const Component = (props: any) => (
      <View testID={`svg-${name}`} {...props} />
    );
    Component.displayName = name;
    return Component;
  };
  return {
    __esModule: true,
    default: mock('Svg'),
    Path: mock('Path'),
    Rect: mock('Rect'),
    Ellipse: mock('Ellipse'),
  };
});

// Mock themed/ui components
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

jest.mock('@/components/themed/ThemedTextInput', () => {
  const { TextInput } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: (props: any) => <TextInput {...props} />,
  };
});

jest.mock('@/components/themed/ThemedScrollView', () => {
  const { ScrollView } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => (
      <ScrollView {...props}>{children}</ScrollView>
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
  const { View, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ hint }: { hint: string }) => (
      <View>
        <Text>{hint}</Text>
      </View>
    ),
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

// -- Helpers ------------------------------------------------------------------

const baseQuestion: Question = {
  id: 42,
  question: 'Find the hidden marker',
  question_type: 'geocaching',
  point_value: 10,
  target_latitude: 47.6164,
  target_longitude: 7.6706,
  proximity_radius: 15,
  input_type: 'text',
};

function setupLocationMocks(opts?: {
  permissionStatus?: string;
  canAskAgain?: boolean;
  initialPosition?: { latitude: number; longitude: number };
}) {
  const status = opts?.permissionStatus ?? 'granted';
  const canAskAgain = opts?.canAskAgain ?? true;
  const pos = opts?.initialPosition ?? { latitude: 47.0, longitude: 7.0 };

  mockRequestForegroundPermissionsAsync.mockResolvedValue({
    status,
    canAskAgain,
    granted: status === 'granted',
  });
  mockGetForegroundPermissionsAsync.mockResolvedValue({
    status,
    canAskAgain,
    granted: status === 'granted',
  });

  mockGetCurrentPositionAsync.mockResolvedValue({
    coords: { latitude: pos.latitude, longitude: pos.longitude, accuracy: 10 },
  });

  const positionRemove = jest.fn();
  mockWatchPositionAsync.mockResolvedValue({ remove: positionRemove });

  const headingRemove = jest.fn();
  mockWatchHeadingAsync.mockResolvedValue({ remove: headingRemove });

  return { positionRemove, headingRemove };
}

// -- Tests --------------------------------------------------------------------

describe('GeocachingQuestion', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    const storeMock = jest.requireMock('@/services/storage/Store');
    storeMock.store$.isTourMode.get.mockReturnValue(false);
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(),
    ]);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setupLocationMocks();
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  // -- Rendering: missing coordinates ----------------------------------------

  it('shows error when question has no coordinates', () => {
    const q = {
      ...baseQuestion,
      target_latitude: undefined,
      target_longitude: undefined,
    } as any;

    const { getByText } = render(<GeocachingQuestion question={q} />);

    expect(getByText('geocaching.error.noCoordinates')).toBeTruthy();
    expect(getByText('question.skip')).toBeTruthy();
  });

  it('persists a missing-coordinate skip before advancing', async () => {
    const question = {
      ...baseQuestion,
      target_latitude: undefined,
      target_longitude: undefined,
    } as any;
    const { getByText } = render(<GeocachingQuestion question={question} />);

    fireEvent.press(getByText('question.skip'));

    await waitFor(() =>
      expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledWith({
        teamId: 1,
        questionId: 42,
        pointsAwarded: 0,
        isCorrect: false,
        showTourFeedback: false,
      })
    );
    expect(mockGotoNextQuestion).not.toHaveBeenCalled();
  });

  it('suppresses duplicate missing-coordinate skips while pending', async () => {
    let resolveSubmission: ((value: { status: 'sent' }) => void) | undefined;
    mockSubmitAnswerAndAdvance.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmission = resolve;
        })
    );
    const question = {
      ...baseQuestion,
      target_latitude: undefined,
      target_longitude: undefined,
    } as any;
    const { getByText } = render(<GeocachingQuestion question={question} />);
    const skipButton = getByText('question.skip');

    fireEvent.press(skipButton);
    fireEvent.press(skipButton);

    expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledTimes(1);
    await act(async () => resolveSubmission?.({ status: 'sent' }));
  });

  it('alerts and keeps the missing-coordinate question visible when skip persistence fails', async () => {
    mockSubmitAnswerAndAdvance.mockRejectedValue(new Error('save failed'));
    const question = {
      ...baseQuestion,
      target_latitude: undefined,
      target_longitude: undefined,
    } as any;
    const { getByText } = render(<GeocachingQuestion question={question} />);

    fireEvent.press(getByText('question.skip'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'common.errorTitle',
        'question.error.saveAnswer'
      )
    );
    expect(getByText('geocaching.error.noCoordinates')).toBeTruthy();
    expect(mockGotoNextQuestion).not.toHaveBeenCalled();
  });

  // -- Rendering: location denied --------------------------------------------

  it('shows location denied screen when permission is not granted', async () => {
    setupLocationMocks({ permissionStatus: 'denied' });

    const { getByText } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => {
      expect(getByText('geocaching.error.locationDenied')).toBeTruthy();
    });

    expect(getByText('geocaching.retryPermission')).toBeTruthy();
    expect(getByText('common.surrender')).toBeTruthy();
  });

  describe('when location access can no longer be requested', () => {
    const currentPosition = { latitude: 47.0, longitude: 7.0 };
    const expectedDistance = formatDistance(
      haversineDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        baseQuestion.target_latitude!,
        baseQuestion.target_longitude!
      )
    );
    let openSettingsSpy: jest.SpyInstance;

    // Grant access and report a position so the navigation shows a distance
    function grantLocation() {
      setupLocationMocks({ initialPosition: currentPosition });
      mockWatchPositionAsync.mockImplementation(
        async (_opts: unknown, cb: Function) => {
          cb({ coords: { ...currentPosition, accuracy: 5 } });
          return { remove: jest.fn() };
        }
      );
    }

    beforeEach(() => {
      openSettingsSpy = jest
        .spyOn(Linking, 'openSettings')
        .mockResolvedValue(undefined);
      setupLocationMocks({ permissionStatus: 'denied', canAskAgain: false });
    });

    afterEach(() => {
      openSettingsSpy.mockRestore();
    });

    it('opens the settings from the blocked screen', async () => {
      const { findByText } = render(
        <GeocachingQuestion question={baseQuestion} />
      );

      expect(
        await findByText('geocaching.error.locationDeniedInSettings')
      ).toBeTruthy();

      fireEvent.press(await findByText('common.openSettings'));

      await waitFor(() => expect(openSettingsSpy).toHaveBeenCalledTimes(1));
    });

    it('starts navigating instead of opening settings when the block was stale', async () => {
      const { findByText } = render(
        <GeocachingQuestion question={baseQuestion} />
      );
      const settingsButton = await findByText('common.openSettings');

      grantLocation();
      fireEvent.press(settingsButton);

      expect(await findByText(expectedDistance)).toBeTruthy();
      expect(openSettingsSpy).not.toHaveBeenCalled();
    });

    it('does not jump to the settings when a retried dialog is denied again', async () => {
      setupLocationMocks({ permissionStatus: 'denied' });
      const { findByText } = render(
        <GeocachingQuestion question={baseQuestion} />
      );
      const retryButton = await findByText('geocaching.retryPermission');

      setupLocationMocks({ permissionStatus: 'denied', canAskAgain: false });
      fireEvent.press(retryButton);

      expect(await findByText('common.openSettings')).toBeTruthy();
      expect(openSettingsSpy).not.toHaveBeenCalled();
    });

    it('resumes navigating when access was granted in the settings', async () => {
      const { findByText } = render(
        <GeocachingQuestion question={baseQuestion} />
      );
      await findByText('common.openSettings');

      // Simulate returning from the system settings
      const changeListeners = jest
        .mocked(AppState.addEventListener)
        .mock.calls.filter(([type]) => type === 'change');
      const appStateListener = changeListeners.at(-1)?.[1];

      grantLocation();
      await act(async () => {
        appStateListener?.('active');
      });

      expect(await findByText(expectedDistance)).toBeTruthy();
    });
  });

  // -- Rendering: navigation phase -------------------------------------------

  it('renders question text and surrender button in navigation phase', async () => {
    const { getByText } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => {
      expect(getByText('Find the hidden marker')).toBeTruthy();
    });

    expect(getByText('common.surrender')).toBeTruthy();
  });

  it('explains that the destination must be found before answering', async () => {
    const { getByText } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => {
      expect(getByText('geocaching.instruction.text')).toBeTruthy();
    });
  });

  it('explains that the destination must be found before scanning', async () => {
    const { getByText } = render(
      <GeocachingQuestion
        question={{ ...baseQuestion, input_type: 'qr' as const }}
      />
    );

    await waitFor(() => {
      expect(getByText('geocaching.instruction.qr')).toBeTruthy();
    });
  });

  it('shows the arrow without calibration while no heading reading has arrived', async () => {
    const { findByTestId, queryByText } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => expect(mockWatchHeadingAsync).toHaveBeenCalled());

    expect(await findByTestId('compass-3d-arrow')).toBeTruthy();
    expect(queryByText('geocaching.calibrate')).toBeNull();
  });

  it('asks for calibration when the compass reports an unreliable heading', async () => {
    const { findByText, queryByTestId } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => expect(mockWatchHeadingAsync).toHaveBeenCalled());
    const headingCallback = mockWatchHeadingAsync.mock.calls[0][0];
    act(() => {
      headingCallback({ trueHeading: 90, magHeading: 90, accuracy: 0 });
    });

    expect(await findByText('geocaching.calibrate')).toBeTruthy();
    expect(queryByTestId('compass-3d-arrow')).toBeNull();
  });

  it('starts location tracking on mount', async () => {
    render(<GeocachingQuestion question={baseQuestion} />);

    await waitFor(() => {
      expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockGetCurrentPositionAsync).toHaveBeenCalled();
      expect(mockWatchPositionAsync).toHaveBeenCalled();
      expect(mockWatchHeadingAsync).toHaveBeenCalled();
    });
  });

  // -- Rendering: answer phase (text) ----------------------------------------

  it('shows text input after arrival (phase=answering)', async () => {
    // Simulate arrival by triggering the position callback with distance < radius
    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        // Call with position very close to target
        cb({
          coords: {
            latitude: baseQuestion.target_latitude,
            longitude: baseQuestion.target_longitude,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText, getByPlaceholderText } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => {
      expect(getByText(/geocaching\.arrived/)).toBeTruthy();
    });

    expect(getByPlaceholderText('question.placeholder.answer')).toBeTruthy();
    expect(getByText('question.submit')).toBeTruthy();
  });

  // -- Text answer submission -------------------------------------------------

  it('submits correct text answer', async () => {
    // Setup answers mock with correct answer
    const storeMock = jest.requireMock('@/services/storage/Store');
    storeMock.store$.answers.get.mockReturnValue([
      { question_id: 42, text: 'secret code', correct: true },
    ]);

    mockSubmitAnswerAndAdvance.mockResolvedValue({ status: 'sent' });

    // Simulate arrival
    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: baseQuestion.target_latitude,
            longitude: baseQuestion.target_longitude,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText, getByPlaceholderText } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => {
      expect(getByText(/geocaching\.arrived/)).toBeTruthy();
    });

    const input = getByPlaceholderText('question.placeholder.answer');
    fireEvent.changeText(input, 'secret code');
    fireEvent.press(getByText('question.submit'));

    await waitFor(() => {
      expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 1,
          questionId: 42,
          pointsAwarded: 10,
          isCorrect: true,
          answerText: 'secret code',
        })
      );
    });
  });

  it('submits incorrect text answer with 0 points', async () => {
    const storeMock = jest.requireMock('@/services/storage/Store');
    storeMock.store$.answers.get.mockReturnValue([
      { question_id: 42, text: 'secret code', correct: true },
    ]);

    mockSubmitAnswerAndAdvance.mockResolvedValue({ status: 'sent' });

    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: baseQuestion.target_latitude,
            longitude: baseQuestion.target_longitude,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText, getByPlaceholderText } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => {
      expect(getByText(/geocaching\.arrived/)).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText('question.placeholder.answer'),
      'wrong answer'
    );
    fireEvent.press(getByText('question.submit'));

    await waitFor(() => {
      expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledWith(
        expect.objectContaining({
          pointsAwarded: 0,
          isCorrect: false,
          answerText: 'wrong answer',
        })
      );
    });
  });

  it('does not submit when text answer is empty', async () => {
    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: baseQuestion.target_latitude,
            longitude: baseQuestion.target_longitude,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => {
      expect(getByText(/geocaching\.arrived/)).toBeTruthy();
    });

    // Try pressing submit with empty answer — the component disables the button
    // so onPress won't fire and no submission happens
    fireEvent.press(getByText('question.submit'));

    // Give time for any async action to settle
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSubmitAnswerAndAdvance).not.toHaveBeenCalled();
  });

  it('ignores submit-editing events while a text submission is already in flight', async () => {
    const storeMock = jest.requireMock('@/services/storage/Store');
    storeMock.store$.answers.get.mockReturnValue([
      { question_id: 42, text: 'secret code', correct: true },
    ]);

    let resolveSubmit: (value: { status: 'sent' }) => void = () => {};
    mockSubmitAnswerAndAdvance.mockImplementation(
      () =>
        new Promise<{ status: 'sent' }>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: baseQuestion.target_latitude,
            longitude: baseQuestion.target_longitude,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText, getByPlaceholderText } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => {
      expect(getByText(/geocaching\.arrived/)).toBeTruthy();
    });

    const input = getByPlaceholderText('question.placeholder.answer');
    fireEvent.changeText(input, 'secret code');

    await act(async () => {
      fireEvent(input, 'submitEditing', {
        nativeEvent: { text: 'secret code' },
      });
      await Promise.resolve();
    });

    expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent(input, 'submitEditing', {
        nativeEvent: { text: 'secret code' },
      });
      await Promise.resolve();
    });

    expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSubmit({ status: 'sent' });
      await Promise.resolve();
    });
  });

  // -- Surrender --------------------------------------------------------------

  it('submits surrender with 0 points', async () => {
    mockSubmitAnswerAndAdvance.mockResolvedValue({ status: 'sent' });

    const { getByText } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => {
      expect(getByText('common.surrender')).toBeTruthy();
    });

    fireEvent.press(getByText('common.surrender'));

    await waitFor(() => {
      expect(confirm).toHaveBeenCalled();
      expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledWith(
        expect.objectContaining({
          pointsAwarded: 0,
          isCorrect: false,
        })
      );
    });
  });

  // -- QR mode ----------------------------------------------------------------

  it('renders QR scanner button in answer phase with qr input type', async () => {
    const qrQuestion = {
      ...baseQuestion,
      input_type: 'qr' as const,
    };

    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: qrQuestion.target_latitude!,
            longitude: qrQuestion.target_longitude!,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText } = render(<GeocachingQuestion question={qrQuestion} />);

    await waitFor(() => {
      expect(getByText(/geocaching\.arrived/)).toBeTruthy();
    });

    expect(getByText('question.qr.scan')).toBeTruthy();
  });

  it('allows surrender when camera access is denied in qr mode', async () => {
    const qrQuestion = {
      ...baseQuestion,
      input_type: 'qr' as const,
    };
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      jest.fn(),
    ]);
    mockSubmitAnswerAndAdvance.mockResolvedValue({ status: 'sent' });

    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: qrQuestion.target_latitude!,
            longitude: qrQuestion.target_longitude!,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText } = render(<GeocachingQuestion question={qrQuestion} />);

    await waitFor(() => {
      expect(getByText('question.camera.needAccess')).toBeTruthy();
    });

    expect(getByText('common.surrender')).toBeTruthy();

    fireEvent.press(getByText('common.surrender'));

    await waitFor(() => {
      expect(confirm).toHaveBeenCalled();
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

  it('stores the scanned QR value as answer text', async () => {
    const qrQuestion = {
      ...baseQuestion,
      input_type: 'qr' as const,
    };
    const storeMock = jest.requireMock('@/services/storage/Store');
    const scannedValue = 'Secret Code';

    storeMock.store$.answers.get.mockReturnValue([
      { question_id: 42, text: 'secret code', correct: true },
    ]);
    mockSubmitAnswerAndAdvance.mockResolvedValue({ status: 'sent' });

    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: qrQuestion.target_latitude!,
            longitude: qrQuestion.target_longitude!,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText, getByTestId } = render(
      <GeocachingQuestion question={qrQuestion} />
    );

    await waitFor(() => {
      expect(getByText('question.qr.scan')).toBeTruthy();
    });

    fireEvent.press(getByText('question.qr.scan'));
    fireEvent(getByTestId('camera-view'), 'onBarcodeScanned', {
      data: scannedValue,
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
      expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 1,
          questionId: 42,
          pointsAwarded: 10,
          isCorrect: true,
          answerText: scannedValue,
        })
      );
    });
  });

  it('submits a correct tour QR scan without the old success alert', async () => {
    const qrQuestion = { ...baseQuestion, input_type: 'qr' as const };
    const storeMock = jest.requireMock('@/services/storage/Store');
    storeMock.store$.isTourMode.get.mockReturnValue(true);
    storeMock.store$.answers.get.mockReturnValue([
      { question_id: 42, text: 'secret code', correct: true },
    ]);
    mockSubmitAnswerAndAdvance.mockResolvedValue({ status: 'local' });
    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: qrQuestion.target_latitude!,
            longitude: qrQuestion.target_longitude!,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText, getByTestId } = render(
      <GeocachingQuestion question={qrQuestion} />
    );
    await waitFor(() => expect(getByText('question.qr.scan')).toBeTruthy());

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

  it('accepts scanned QR values with trailing whitespace', async () => {
    const qrQuestion = {
      ...baseQuestion,
      input_type: 'qr' as const,
    };
    const storeMock = jest.requireMock('@/services/storage/Store');

    storeMock.store$.answers.get.mockReturnValue([
      { question_id: 42, text: 'secret code', correct: true },
    ]);
    mockSubmitAnswerAndAdvance.mockResolvedValue({ status: 'sent' });

    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: qrQuestion.target_latitude!,
            longitude: qrQuestion.target_longitude!,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText, getByTestId } = render(
      <GeocachingQuestion question={qrQuestion} />
    );

    await waitFor(() => {
      expect(getByText('question.qr.scan')).toBeTruthy();
    });

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
  });

  it('ignores duplicate incorrect QR scan events while the camera is closing', async () => {
    const qrQuestion = {
      ...baseQuestion,
      input_type: 'qr' as const,
    };
    const storeMock = jest.requireMock('@/services/storage/Store');

    storeMock.store$.answers.get.mockReturnValue([
      { question_id: 42, text: 'secret code', correct: true },
    ]);

    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: qrQuestion.target_latitude!,
            longitude: qrQuestion.target_longitude!,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText, getByTestId } = render(
      <GeocachingQuestion question={qrQuestion} />
    );

    await waitFor(() => {
      expect(getByText('question.qr.scan')).toBeTruthy();
    });

    fireEvent.press(getByText('question.qr.scan'));

    const camera = getByTestId('camera-view');
    act(() => {
      camera.props.onBarcodeScanned({ data: 'wrong code' });
      camera.props.onBarcodeScanned({ data: 'wrong code' });
    });

    expect(
      alertSpy.mock.calls.filter(
        ([title, message]) =>
          title === 'common.errorTitle' && message === 'question.qr.incorrect'
      )
    ).toHaveLength(1);
    expect(mockSubmitAnswerAndAdvance).not.toHaveBeenCalled();
  });

  // -- Hint -------------------------------------------------------------------

  it('shows hint in answer phase when hint is provided', async () => {
    const qWithHint = { ...baseQuestion, hint: 'Look under the bench' };

    mockWatchPositionAsync.mockImplementation(
      async (_opts: any, cb: Function) => {
        cb({
          coords: {
            latitude: qWithHint.target_latitude!,
            longitude: qWithHint.target_longitude!,
            accuracy: 5,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const { getByText } = render(<GeocachingQuestion question={qWithHint} />);

    await waitFor(() => {
      expect(getByText('Look under the bench')).toBeTruthy();
    });
  });

  // -- Cleanup ----------------------------------------------------------------

  it('removes subscriptions on unmount', async () => {
    const { positionRemove, headingRemove } = setupLocationMocks();

    const { unmount } = render(<GeocachingQuestion question={baseQuestion} />);

    await waitFor(() => {
      expect(mockWatchPositionAsync).toHaveBeenCalled();
    });

    unmount();

    expect(positionRemove).toHaveBeenCalled();
    expect(headingRemove).toHaveBeenCalled();
  });

  it('removes a late position subscription that resolves after unmount', async () => {
    type ResolvePositionSubscription = (value: { remove: jest.Mock }) => void;
    let resolvePositionSubscription: ResolvePositionSubscription | null = null;
    const latePositionRemove = jest.fn();

    mockWatchPositionAsync.mockImplementation(
      () =>
        new Promise<{ remove: jest.Mock }>((resolve) => {
          resolvePositionSubscription = resolve;
        })
    );

    const { unmount } = render(<GeocachingQuestion question={baseQuestion} />);

    await waitFor(() => {
      expect(mockWatchPositionAsync).toHaveBeenCalled();
    });

    unmount();

    if (!resolvePositionSubscription) {
      throw new Error('Expected position subscription resolver');
    }
    (resolvePositionSubscription as ResolvePositionSubscription)({
      remove: latePositionRemove,
    });

    await waitFor(() => {
      expect(latePositionRemove).toHaveBeenCalled();
    });

    expect(mockWatchHeadingAsync).not.toHaveBeenCalled();
    expect(mockDeviceMotionAddListener).not.toHaveBeenCalled();
  });
});
