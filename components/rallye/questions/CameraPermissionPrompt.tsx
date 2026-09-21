import React, { useEffect } from 'react';
import { AppState, Linking, View } from 'react-native';
import { globalStyles } from '@/utils/GlobalStyles';
import { useAppStyles } from '@/utils/AppStyles';
import { useLanguage } from '@/utils/LanguageContext';
import Colors from '@/utils/Colors';
import ThemedText from '@/components/themed/ThemedText';
import UIButton from '@/components/ui/UIButton';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';

type PermissionResult = { granted: boolean; canAskAgain: boolean };

type CameraPermissionPromptProps = {
  questionText: string;
  /** False once the OS no longer shows the permission dialog. */
  canAskAgain: boolean;
  onRequestPermission: () => Promise<PermissionResult>;
  /** Re-reads the permission status without prompting the user. */
  onRefreshPermission: () => void;
  onSurrender: () => void;
};

/** Shown by camera-based questions while camera access is not granted. */
export default function CameraPermissionPrompt({
  questionText,
  canAskAgain,
  onRequestPermission,
  onRefreshPermission,
  onSurrender,
}: CameraPermissionPromptProps) {
  const { t } = useLanguage();
  const s = useAppStyles();

  // Access may have been granted in the system settings meanwhile
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') onRefreshPermission();
    });
    return () => subscription.remove();
  }, [onRefreshPermission]);

  const handleOpenSettings = async () => {
    // A stale canAskAgain=false can hide a dialog the OS would show again
    // (e.g. after "Ask every time"); a truly blocked request resolves
    // immediately without UI, so only then send the user to the settings.
    const result = await onRequestPermission();
    if (!result.granted && !result.canAskAgain) {
      await Linking.openSettings();
    }
  };

  return (
    <VStack
      style={[
        globalStyles.default.container,
        { alignItems: 'stretch', flex: 0, flexGrow: 0 },
      ]}
      gap={2}
    >
      <InfoBox mb={0}>
        <ThemedText
          variant="title"
          style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
        >
          {questionText}
        </ThemedText>
      </InfoBox>
      <InfoBox mb={0}>
        <ThemedText style={[{ textAlign: 'center', marginBottom: 10 }, s.text]}>
          {canAskAgain
            ? t('question.camera.needAccess')
            : t('question.camera.deniedInSettings')}
        </ThemedText>
        {canAskAgain ? (
          <UIButton onPress={() => void onRequestPermission()}>
            {t('question.camera.allow')}
          </UIButton>
        ) : (
          <UIButton onPress={() => void handleOpenSettings()}>
            {t('question.camera.openSettings')}
          </UIButton>
        )}
        <View style={{ marginTop: 10 }}>
          <UIButton
            icon="face-frown-open"
            color={Colors.dhbwGray}
            onPress={onSurrender}
          >
            {t('common.surrender')}
          </UIButton>
        </View>
      </InfoBox>
    </VStack>
  );
}
