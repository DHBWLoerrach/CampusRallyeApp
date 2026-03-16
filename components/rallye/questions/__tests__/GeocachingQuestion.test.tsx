import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import GeocachingQuestion from '../GeocachingQuestion';
import { Question } from '@/types/rallye';
import { confirm } from '@/utils/ConfirmAlert';

// -- Mocks -------------------------------------------------------------------

// Replace the 3D canvas component with a simple View so Jest doesn't need WebGL
jest.mock('@/components/rallye/questions/Compass3DArrow', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <View testID="compass-3d-arrow" />,
  };
});

const mockSubmitAnswerAndAdvance = jest.fn();
jest.mock('@/services/storage/answerSubmission', () => ({
  submitAnswerAndAdvance: (...args: unknown[]) =>
    mockSubmitAnswerAndAdvance(...args),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { get: jest.fn(() => ({ id: 1 })) },
    answers: { get: jest.fn(() => []) },
    gotoNextQuestion: jest.fn(),
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

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: (...args: unknown[]) =>
    mockRequestForegroundPermissionsAsync(...args),
  getCurrentPositionAsync: (...args: unknown[]) =>
    mockGetCurrentPositionAsync(...args),
  watchPositionAsync: (...args: unknown[]) =>
    mockWatchPositionAsync(...args),
  watchHeadingAsync: (...args: unknown[]) =>
    mockWatchHeadingAsync(...args),
  Accuracy: {
    Balanced: 3,
    BestForNavigation: 5,
  },
}));

// Mock expo-sensors (DeviceMotion)
jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// Mock expo-camera
const mockUseCameraPermissions = jest.fn(() => [
  { granted: true },
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
    const Component = (props: any) => <View testID={`svg-${name}`} {...props} />;
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
  points: 10,
  target_latitude: 47.6164,
  target_longitude: 7.6706,
  proximity_radius: 15,
  geocaching_input_type: 'text',
};

function setupLocationMocks(opts?: {
  permissionStatus?: string;
  initialPosition?: { latitude: number; longitude: number };
}) {
  const status = opts?.permissionStatus ?? 'granted';
  const pos = opts?.initialPosition ?? { latitude: 47.0, longitude: 7.0 };

  mockRequestForegroundPermissionsAsync.mockResolvedValue({ status });

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
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setupLocationMocks();
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  // -- Rendering: missing coordinates ----------------------------------------

  it('shows error when question has no coordinates', () => {
    const q = { ...baseQuestion, target_latitude: undefined, target_longitude: undefined } as any;

    const { getByText } = render(<GeocachingQuestion question={q} />);

    expect(getByText('geocaching.error.noCoordinates')).toBeTruthy();
    expect(getByText('question.skip')).toBeTruthy();
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
    mockWatchPositionAsync.mockImplementation(async (_opts: any, cb: Function) => {
      // Call with position very close to target
      cb({
        coords: {
          latitude: baseQuestion.target_latitude,
          longitude: baseQuestion.target_longitude,
          accuracy: 5,
        },
      });
      return { remove: jest.fn() };
    });

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
    mockWatchPositionAsync.mockImplementation(async (_opts: any, cb: Function) => {
      cb({
        coords: {
          latitude: baseQuestion.target_latitude,
          longitude: baseQuestion.target_longitude,
          accuracy: 5,
        },
      });
      return { remove: jest.fn() };
    });

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
          answeredCorrectly: true,
          pointsAwarded: 10,
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

    mockWatchPositionAsync.mockImplementation(async (_opts: any, cb: Function) => {
      cb({
        coords: {
          latitude: baseQuestion.target_latitude,
          longitude: baseQuestion.target_longitude,
          accuracy: 5,
        },
      });
      return { remove: jest.fn() };
    });

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
          answeredCorrectly: false,
          pointsAwarded: 0,
          answerText: 'wrong answer',
        })
      );
    });
  });

  it('does not submit when text answer is empty', async () => {
    mockWatchPositionAsync.mockImplementation(async (_opts: any, cb: Function) => {
      cb({
        coords: {
          latitude: baseQuestion.target_latitude,
          longitude: baseQuestion.target_longitude,
          accuracy: 5,
        },
      });
      return { remove: jest.fn() };
    });

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
          answeredCorrectly: false,
          pointsAwarded: 0,
        })
      );
    });
  });

  // -- QR mode ----------------------------------------------------------------

  it('renders QR scanner button in answer phase with qr input type', async () => {
    const qrQuestion = { ...baseQuestion, geocaching_input_type: 'qr' as const };

    mockWatchPositionAsync.mockImplementation(async (_opts: any, cb: Function) => {
      cb({
        coords: {
          latitude: qrQuestion.target_latitude!,
          longitude: qrQuestion.target_longitude!,
          accuracy: 5,
        },
      });
      return { remove: jest.fn() };
    });

    const { getByText } = render(
      <GeocachingQuestion question={qrQuestion} />
    );

    await waitFor(() => {
      expect(getByText(/geocaching\.arrived/)).toBeTruthy();
    });

    expect(getByText('question.qr.scan')).toBeTruthy();
  });

  it('allows surrender when camera access is denied in qr mode', async () => {
    const qrQuestion = { ...baseQuestion, geocaching_input_type: 'qr' as const };
    mockUseCameraPermissions.mockReturnValue([{ granted: false }, jest.fn()]);
    mockSubmitAnswerAndAdvance.mockResolvedValue({ status: 'sent' });

    mockWatchPositionAsync.mockImplementation(async (_opts: any, cb: Function) => {
      cb({
        coords: {
          latitude: qrQuestion.target_latitude!,
          longitude: qrQuestion.target_longitude!,
          accuracy: 5,
        },
      });
      return { remove: jest.fn() };
    });

    const { getByText } = render(
      <GeocachingQuestion question={qrQuestion} />
    );

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
          answeredCorrectly: false,
          pointsAwarded: 0,
        })
      );
    });
  });

  // -- Hint -------------------------------------------------------------------

  it('shows hint in answer phase when hint is provided', async () => {
    const qWithHint = { ...baseQuestion, hint: 'Look under the bench' };

    mockWatchPositionAsync.mockImplementation(async (_opts: any, cb: Function) => {
      cb({
        coords: {
          latitude: qWithHint.target_latitude!,
          longitude: qWithHint.target_longitude!,
          accuracy: 5,
        },
      });
      return { remove: jest.fn() };
    });

    const { getByText } = render(
      <GeocachingQuestion question={qWithHint} />
    );

    await waitFor(() => {
      expect(getByText('Look under the bench')).toBeTruthy();
    });
  });

  // -- Cleanup ----------------------------------------------------------------

  it('removes subscriptions on unmount', async () => {
    const { positionRemove, headingRemove } = setupLocationMocks();

    const { unmount } = render(
      <GeocachingQuestion question={baseQuestion} />
    );

    await waitFor(() => {
      expect(mockWatchPositionAsync).toHaveBeenCalled();
    });

    unmount();

    expect(positionRemove).toHaveBeenCalled();
    expect(headingRemove).toHaveBeenCalled();
  });
});
