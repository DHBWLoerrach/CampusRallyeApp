import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import CameraPermissionPrompt from '../CameraPermissionPrompt';

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ text: {} }),
}));

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
    }: {
      children: React.ReactNode;
      onPress?: () => void;
    }) => (
      <Pressable onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
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

type PermissionResult = { granted: boolean; canAskAgain: boolean };

function renderPrompt(
  canAskAgain: boolean,
  requestResult: PermissionResult = { granted: false, canAskAgain }
) {
  const props = {
    questionText: 'Take a group photo',
    canAskAgain,
    onRequestPermission: jest.fn(() => Promise.resolve(requestResult)),
    onRefreshPermission: jest.fn(),
    onSurrender: jest.fn(),
  };
  return { props, ...render(<CameraPermissionPrompt {...props} />) };
}

describe('CameraPermissionPrompt', () => {
  let openSettingsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    openSettingsSpy = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests the permission while the OS can still ask', () => {
    const { props, getByText, queryByText } = renderPrompt(true);

    expect(getByText('Take a group photo')).toBeTruthy();
    expect(getByText('question.camera.needAccess')).toBeTruthy();
    expect(queryByText('common.openSettings')).toBeNull();

    fireEvent.press(getByText('question.camera.allow'));

    expect(props.onRequestPermission).toHaveBeenCalledTimes(1);
    expect(openSettingsSpy).not.toHaveBeenCalled();
  });

  it('opens the system settings when the permission is blocked', async () => {
    const { props, getByText, queryByText } = renderPrompt(false);

    expect(getByText('question.camera.deniedInSettings')).toBeTruthy();
    expect(queryByText('question.camera.allow')).toBeNull();

    fireEvent.press(getByText('common.openSettings'));

    await waitFor(() => expect(openSettingsSpy).toHaveBeenCalledTimes(1));
    expect(props.onRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('stays in the app when the OS can show the dialog again despite a stale block', async () => {
    const { props, getByText } = renderPrompt(false, {
      granted: false,
      canAskAgain: true,
    });

    fireEvent.press(getByText('common.openSettings'));

    await waitFor(() =>
      expect(props.onRequestPermission).toHaveBeenCalledTimes(1)
    );
    expect(openSettingsSpy).not.toHaveBeenCalled();
  });

  it('lets the team surrender without camera access', () => {
    const { props, getByText } = renderPrompt(false);

    fireEvent.press(getByText('common.surrender'));

    expect(props.onSurrender).toHaveBeenCalledTimes(1);
  });
});
