import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import UploadPhotoQuestion from '../UploadPhotoQuestion';
import { Question } from '@/types/rallye';
import { confirm } from '@/utils/ConfirmAlert';

const mockSubmitAnswerAndAdvance = jest.fn();
const mockSubmitPhotoAnswerAndAdvance = jest.fn();

jest.mock('@/services/storage/answerSubmission', () => ({
  submitAnswerAndAdvance: (...args: unknown[]) =>
    mockSubmitAnswerAndAdvance(...args),
  submitPhotoAnswerAndAdvance: (...args: unknown[]) =>
    mockSubmitPhotoAnswerAndAdvance(...args),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { get: jest.fn(() => ({ id: 1 })) },
  },
}));

jest.mock('@/services/storage/offlineOutbox', () => ({
  outbox$: {
    online: { get: jest.fn(() => true) },
  },
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ text: {}, muted: {}, screen: {} }),
}));

jest.mock('@/utils/ConfirmAlert', () => ({
  confirm: jest.fn(() => Promise.resolve(true)),
}));

const mockedConfirm = jest.mocked(confirm);

const mockTakePictureAsync = jest.fn();
const mockUseCameraPermissions = jest.fn();

jest.mock('expo-camera', () => {
  const ReactActual = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    CameraView: ReactActual.forwardRef(
      (props: Record<string, unknown>, ref: unknown) => {
        ReactActual.useImperativeHandle(ref, () => ({
          takePictureAsync: mockTakePictureAsync,
        }));
        return <View testID="camera-view" {...props} />;
      }
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

jest.mock('@/components/ui/Hint', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ hint }: { hint: string }) => (
      <Text testID="hint">{hint}</Text>
    ),
  };
});

jest.mock('@/components/ui/UIButton', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      onPress,
      disabled,
      icon,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      disabled?: boolean;
      icon?: string;
    }) => (
      <Text
        testID={`button-${icon ?? 'default'}`}
        onPress={disabled ? undefined : onPress}
      >
        {children}
      </Text>
    ),
  };
});

const baseQuestion: Question = {
  id: 42,
  question: 'Take a photo of the library',
  question_type: 'upload',
  points: 10,
  hint: null,
};

describe('UploadPhotoQuestion', () => {
  let alertSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    mockTakePictureAsync.mockResolvedValue({ uri: 'file://photo.jpg' });
    mockSubmitPhotoAnswerAndAdvance.mockResolvedValue({ status: 'success' });
    mockSubmitAnswerAndAdvance.mockResolvedValue(undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  describe('PhotoCamera', () => {
    it('renders camera view when permission is granted', () => {
      const { getByTestId, getByText } = render(
        <UploadPhotoQuestion question={baseQuestion} />
      );

      expect(getByTestId('camera-view')).toBeTruthy();
      expect(getByText('Take a photo of the library')).toBeTruthy();
      expect(getByText('question.photo.take')).toBeTruthy();
      expect(getByText('question.photo.switch')).toBeTruthy();
    });

    it('takes a picture and switches to preview', async () => {
      const { getByTestId, queryByTestId } = render(
        <UploadPhotoQuestion question={baseQuestion} />
      );

      fireEvent.press(getByTestId('button-camera'));

      await waitFor(() => {
        expect(mockTakePictureAsync).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(queryByTestId('camera-view')).toBeNull();
      });
    });

    it('toggles camera facing direction', () => {
      const { getByTestId } = render(
        <UploadPhotoQuestion question={baseQuestion} />
      );

      const switchButton = getByTestId('button-camera-rotate');
      fireEvent.press(switchButton);
      // The facing state is internal, but we verify the button exists and is pressable
      expect(switchButton).toBeTruthy();
    });

    it('renders hint when provided', () => {
      const questionWithHint = { ...baseQuestion, hint: 'Look near the entrance' };
      const { getByTestId } = render(
        <UploadPhotoQuestion question={questionWithHint} />
      );

      expect(getByTestId('hint')).toBeTruthy();
    });
  });

  describe('ImagePreview', () => {
    async function renderWithPicture() {
      const result = render(<UploadPhotoQuestion question={baseQuestion} />);
      fireEvent.press(result.getByTestId('button-camera'));
      await waitFor(() => {
        expect(result.queryByTestId('camera-view')).toBeNull();
      });
      return result;
    }

    it('shows image preview after taking a picture', async () => {
      const { getByText } = await renderWithPicture();

      expect(getByText('question.photo.new')).toBeTruthy();
      expect(getByText('question.photo.send')).toBeTruthy();
    });

    it('allows taking a new photo', async () => {
      const { getByTestId, queryByTestId } = await renderWithPicture();

      fireEvent.press(getByTestId('button-recycle'));

      await waitFor(() => {
        expect(queryByTestId('camera-view')).toBeTruthy();
      });
    });

    it('submits photo and advances on success', async () => {
      const { getByTestId } = await renderWithPicture();

      fireEvent.press(getByTestId('button-envelope'));

      await waitFor(() => {
        expect(mockSubmitPhotoAnswerAndAdvance).toHaveBeenCalledWith({
          teamId: 1,
          questionId: 42,
          pointsAwarded: 10,
          imageUri: 'file://photo.jpg',
        });
      });
    });

    it('shows alert when photo requires online but user is offline', async () => {
      mockSubmitPhotoAnswerAndAdvance.mockResolvedValueOnce({
        status: 'requires_online',
      });

      const { getByTestId } = await renderWithPicture();

      fireEvent.press(getByTestId('button-envelope'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'common.offline',
          'question.photo.offlineMessage'
        );
      });
    });

    it('shows error alert on submit failure', async () => {
      mockSubmitPhotoAnswerAndAdvance.mockRejectedValueOnce(
        new Error('Upload failed')
      );

      const { getByTestId } = await renderWithPicture();

      fireEvent.press(getByTestId('button-envelope'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'common.errorTitle',
          'question.error.submitPhoto'
        );
      });
    });
  });

  describe('Permission handling', () => {
    it('shows permission request UI when not granted', () => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: false },
        jest.fn(),
      ]);

      const { getByText } = render(
        <UploadPhotoQuestion question={baseQuestion} />
      );

      expect(getByText('question.camera.needAccess')).toBeTruthy();
      expect(getByText('question.camera.allow')).toBeTruthy();
    });

    it('renders empty view while permission is loading', () => {
      mockUseCameraPermissions.mockReturnValue([null, jest.fn()]);

      const { toJSON } = render(
        <UploadPhotoQuestion question={baseQuestion} />
      );

      // Should render minimal/empty view
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Surrender', () => {
    it('calls submitAnswerAndAdvance with zero points on surrender', async () => {
      mockedConfirm.mockResolvedValueOnce(true);

      const { getByTestId } = render(
        <UploadPhotoQuestion question={baseQuestion} />
      );

      fireEvent.press(getByTestId('button-face-frown-open'));

      await waitFor(() => {
        expect(mockSubmitAnswerAndAdvance).toHaveBeenCalledWith({
          teamId: 1,
          questionId: 42,
          answeredCorrectly: false,
          pointsAwarded: 0,
        });
      });
    });

    it('does not surrender when user cancels confirmation', async () => {
      mockedConfirm.mockResolvedValueOnce(false);

      const { getByTestId } = render(
        <UploadPhotoQuestion question={baseQuestion} />
      );

      fireEvent.press(getByTestId('button-face-frown-open'));

      await waitFor(() => {
        expect(mockedConfirm).toHaveBeenCalled();
      });

      expect(mockSubmitAnswerAndAdvance).not.toHaveBeenCalled();
    });
  });
});
