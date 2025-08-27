import React, { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { store$ } from '@/services/storage/Store';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import Colors from '@/utils/Colors';
import { saveAnswer } from '@/services/storage/answerStorage';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedView from '@/components/themed/ThemedView';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';

export default function QRCodeQuestion({ question }: QuestionProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const processingRef = useRef(false);
  const [scanMode, setScanMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const s = useAppStyles();

  const team = store$.team.get();
  const answers = store$.answers.get() as AnswerRow[];
  const correct = (
    answers.find((a) => a.question_id === question.id && a.correct)?.text || ''
  ).toLowerCase();

  const submitSurrender = async () => {
    setScanMode(false);
    if (team) await saveAnswer(team.id, question.id, false, 0);
    store$.gotoNextQuestion();
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
              onPress: async () => {
                store$.points.set(store$.points.get() + question.points);
                if (team)
                  await saveAnswer(team.id, question.id, true, question.points);
                store$.gotoNextQuestion();
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
      <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
        <ThemedText style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}>
          {question.question}
        </ThemedText>
      </View>

      {scanMode && (
        <View style={[globalStyles.qrCodeStyles.cameraBox, s.infoBox]}>
          <CameraView
            ref={cameraRef}
            style={globalStyles.qrCodeStyles.camera}
            onBarcodeScanned={handleQRCode}
          />
        </View>
      )}

      <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
        <View style={globalStyles.qrCodeStyles.buttonRow}>
          <UIButton
            icon={scanMode ? 'circle-stop' : 'qrcode'}
            onPress={() => setScanMode(!scanMode)}
          >
            {scanMode
              ? language === 'de'
                ? 'Kamera ausblenden'
                : 'Hide Camera'
              : language === 'de'
              ? 'QR-Code scannen'
              : 'Scan QR Code'}
          </UIButton>
          <UIButton
            icon="face-frown-open"
            color={Colors.dhbwGray}
            onPress={handleSurrender}
          >
            {language === 'de' ? 'Aufgeben' : 'Surrender'}
          </UIButton>
        </View>
      </View>

      {question.hint ? <Hint hint={question.hint} /> : null}
    </ThemedView>
  );
}
