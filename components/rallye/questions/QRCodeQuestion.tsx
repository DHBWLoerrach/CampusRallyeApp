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
  const { language } = useLanguage();
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
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Antwort konnte nicht gespeichert werden.'
          : 'Answer could not be saved.'
      );
    }
  };

  const handleSurrender = () => {
    Alert.alert(
      language === 'de' ? 'Sicherheitsfrage' : 'Security question',
      language === 'de'
        ? 'Willst du diese Aufgabe wirklich aufgeben?'
        : 'Do you really want to give up this task?',
      [
        { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
        {
          text:
            language === 'de'
              ? 'Ja, ich möchte aufgeben'
              : 'Yes, I want to give up',
          onPress: submitSurrender,
        },
      ]
    );
  };

  const handleQRCode = ({ data }: { data: string }) => {
    if (processingRef.current) return;
    if (!answerKeyReady) {
      Alert.alert(
        language === 'de' ? 'Bitte warten' : 'Please wait',
        language === 'de'
          ? 'Die QR-Code Daten werden noch geladen.'
          : 'QR code data is still loading.'
      );
      return;
    }
    processingRef.current = true;
    setScanMode(false);
    try {
      if (correct !== data.toLowerCase()) {
        Alert.alert(
          language === 'de'
            ? 'Der QR-Code ist falsch! Du bist vermutlich nicht am richtigen Ort.'
            : 'The QR code is incorrect! You are probably not at the right place.'
        );
      } else {
        Alert.alert(
          'OK',
          language === 'de'
            ? 'Das ist der richtige QR-Code!'
            : 'This is the correct QR code!',
          [
            {
              text: language === 'de' ? 'Weiter' : 'Next',
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
                      language === 'de' ? 'Fehler' : 'Error',
                      language === 'de'
                        ? 'Antwort konnte nicht gespeichert werden.'
                        : 'Answer could not be saved.'
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
          {language === 'de'
            ? 'Wir brauchen Zugriff auf die Kamera'
            : 'We need access to the camera'}
        </ThemedText>
        <UIButton onPress={requestPermission}>
          {language === 'de'
            ? 'Zugriff auf Kamera erlauben'
            : 'Allow access to camera'}
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
                ? language === 'de'
                  ? 'Kamera ausblenden'
                  : 'Hide Camera'
                : language === 'de'
                  ? answerKeyReady
                    ? 'QR-Code scannen'
                    : 'Lade…'
                  : answerKeyReady
                    ? 'Scan QR code'
                    : 'Loading…'}
            </UIButton>
            <UIButton icon="face-frown-open" color={Colors.dhbwGray} onPress={handleSurrender}>
              {language === 'de' ? 'Aufgeben' : 'Surrender'}
            </UIButton>
          </View>
        </InfoBox>

        {question.hint ? <Hint hint={question.hint} /> : null}
      </VStack>
    </ThemedView>
  );
}
