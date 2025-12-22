import React, { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { store$ } from '@/services/storage/Store';
import { useSelector } from '@legendapp/state/react';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import Colors from '@/utils/Colors';
import { submitAnswerAndAdvance } from '@/services/storage/answerSubmission';
import { useLanguage } from '@/utils/LanguageContext';
import { confirm } from '@/utils/ConfirmAlert';
import ThemedView from '@/components/themed/ThemedView';
import ThemedText from '@/components/themed/ThemedText';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import { useAppStyles } from '@/utils/AppStyles';

export default function QRCodeQuestion({ question }: QuestionProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const processingRef = useRef(false);
  const [scanMode, setScanMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { t } = useLanguage();
  const s = useAppStyles();

  const team = store$.team.get();
  const answers = useSelector(() => store$.answers.get() as AnswerRow[]);
  const correct = (
    answers.find((a) => a.question_id === question.id && a.correct)?.text || ''
  )
    .toLowerCase()
    .trim();
  const answerKeyReady = correct.length > 0;

  const submitSurrender = async () => {
    setScanMode(false);
    try {
      await submitAnswerAndAdvance({
        teamId: team?.id ?? null,
        questionId: question.id,
        answeredCorrectly: false,
        pointsAwarded: 0,
      });
    } catch (e) {
      console.error('Error submitting surrender:', e);
      Alert.alert(t('common.errorTitle'), t('question.error.saveAnswer'));
    }
  };

  const handleSurrender = async () => {
    const confirmed = await confirm({
      title: t('confirm.surrender.title'),
      message: t('confirm.surrender.message'),
      confirmText: t('confirm.surrender.confirm'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    await submitSurrender();
  };

  const handleQRCode = ({ data }: { data: string }) => {
    if (processingRef.current) return;
    if (!answerKeyReady) {
      Alert.alert(
        t('question.error.pleaseWaitTitle'),
        t('question.error.qrLoading')
      );
      return;
    }
    processingRef.current = true;
    setScanMode(false);
    try {
      if (correct !== data.toLowerCase()) {
        Alert.alert(t('common.errorTitle'), t('question.qr.incorrect'));
      } else {
        Alert.alert(
          t('common.ok'),
          t('question.qr.correctMessage'),
          [
            {
              text: t('common.next'),
              onPress: () => {
                void (async () => {
                  try {
                    await submitAnswerAndAdvance({
                      teamId: team?.id ?? null,
                      questionId: question.id,
                      answeredCorrectly: true,
                      pointsAwarded: question.points,
                    });
                  } catch (e) {
                    console.error('Error submitting QR answer:', e);
                    Alert.alert(
                      t('common.errorTitle'),
                      t('question.error.saveAnswer')
                    );
                  }
                })();
              },
            },
          ]
        );
      }
    } finally {
      setTimeout(() => {
        processingRef.current = false;
      }, 2000);
    }
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <ThemedView variant="background" style={globalStyles.default.container}>
        <ThemedText style={{ textAlign: 'center', marginBottom: 10 }}>
          {t('question.camera.needAccess')}
        </ThemedText>
        <UIButton onPress={requestPermission}>
          {t('question.camera.allow')}
        </UIButton>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      variant="background"
      style={[globalStyles.default.container, s.screen, { flex: 1 }]}
    >
      <VStack style={{ width: '100%' }} gap={2}>
        <InfoBox mb={0}>
          <ThemedText
            variant="title"
            style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
          >
            {question.question}
          </ThemedText>
        </InfoBox>

        {scanMode && (
          <InfoBox mb={0} style={globalStyles.qrCodeStyles.cameraBox}>
            <CameraView
              ref={cameraRef}
              style={globalStyles.qrCodeStyles.camera}
              onBarcodeScanned={handleQRCode}
            />
          </InfoBox>
        )}

        <InfoBox mb={0}>
          <View style={globalStyles.qrCodeStyles.buttonRow}>
            <UIButton
              icon={scanMode ? 'circle-stop' : 'qrcode'}
              disabled={!answerKeyReady}
              onPress={() => setScanMode(!scanMode)}
            >
              {scanMode
                ? t('question.qr.hideCamera')
                : answerKeyReady
                  ? t('question.qr.scan')
                  : t('common.loading')}
            </UIButton>
            <UIButton icon="face-frown-open" color={Colors.dhbwGray} onPress={handleSurrender}>
              {t('common.surrender')}
            </UIButton>
          </View>
        </InfoBox>

        {question.hint ? <Hint hint={question.hint} /> : null}
      </VStack>
    </ThemedView>
  );
}
