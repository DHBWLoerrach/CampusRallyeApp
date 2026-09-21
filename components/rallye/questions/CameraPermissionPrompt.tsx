import React from 'react';
import { View } from 'react-native';
import { globalStyles } from '@/utils/GlobalStyles';
import { useAppStyles } from '@/utils/AppStyles';
import { useLanguage } from '@/utils/LanguageContext';
import Colors from '@/utils/Colors';
import ThemedText from '@/components/themed/ThemedText';
import UIButton from '@/components/ui/UIButton';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';

type CameraPermissionPromptProps = {
  questionText: string;
  onRequestPermission: () => void;
  onSurrender: () => void;
};

/** Shown by camera-based questions while camera access is not granted. */
export default function CameraPermissionPrompt({
  questionText,
  onRequestPermission,
  onSurrender,
}: CameraPermissionPromptProps) {
  const { t } = useLanguage();
  const s = useAppStyles();

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
          {t('question.camera.needAccess')}
        </ThemedText>
        <UIButton onPress={onRequestPermission}>
          {t('question.camera.allow')}
        </UIButton>
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
