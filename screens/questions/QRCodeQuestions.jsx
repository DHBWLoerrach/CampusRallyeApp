import { useRef, useState, useContext } from 'react';
import { Alert, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { store$ } from '../../services/storage/Store';
import { globalStyles } from '../../utils/GlobalStyles';
import UIButton from '../../ui/UIButton';
import Hint from '../../ui/Hint';
import Colors from '../../utils/Colors';
import { saveAnswer } from '../../services/storage/answerStorage';
import { ThemeContext } from '../../utils/ThemeContext';
import { useLanguage } from '../../utils/LanguageContext'; // Import LanguageContext

export default function QRCodeQuestions() {
  const cameraRef = useRef(null);
  const [scanMode, setScanMode] = useState(false);
  const [isScanCorrect, setScanCorrect] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const currentQuestion = store$.currentQuestion.get();
  const currentAnswer = store$.currentAnswer.get();
  const team = store$.team.get();
  const [isProcessing, setIsProcessing] = useState(false);
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  const submitSurrender = async () => {
    setScanMode(false);
    try {
      if (team && currentQuestion) {
        await saveAnswer(team.id, currentQuestion.id, false, 0);
      }
      store$.gotoNextQuestion();
    } catch (error) {
      console.error(
        language === 'de'
          ? 'Fehler beim Aufgeben:'
          : 'Error surrendering:',
        error
      );
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Beim Aufgeben ist ein Fehler aufgetreten.'
          : 'An error occurred while surrendering.'
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
        {
          text: language === 'de' ? 'Abbrechen' : 'Cancel',
          style: 'cancel',
        },
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

  const handleQRCode = ({ data }) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      if (currentAnswer.text.toLowerCase() !== data.toLowerCase()) {
        Alert.alert(
          language === 'de'
            ? 'Der QR-Code ist falsch! Du bist vermutlich nicht am richtigen Ort.'
            : 'The QR code is incorrect! You are probably not at the right place.'
        );
        setScanMode(false);
      } else if (
        currentAnswer.text.toLowerCase() === data.toLowerCase()
      ) {
        setScanMode(false);
        Alert.alert(
          'OK',
          language === 'de'
            ? 'Das ist der richtige QR-Code!'
            : 'This is the correct QR code!',
          [
            {
              text: language === 'de' ? 'Weiter' : 'Next',
              onPress: async () => {
                await store$.savePoints(true, currentQuestion.points);
                await saveAnswer(
                  team.id,
                  currentQuestion.id,
                  true,
                  currentQuestion.points
                );
                store$.gotoNextQuestion();
              },
            },
          ]
        );
      }
    } finally {
      // Nach Verarbeitung Flag zurücksetzen
      setIsProcessing(false);
    }
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View
        style={[
          globalStyles.default.container,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        <Text
          style={{
            textAlign: 'center',
            marginBottom: 10,
            color: isDarkMode
              ? Colors.darkMode.text
              : Colors.lightMode.text,
          }}
        >
          {language === 'de'
            ? 'Wir brauchen Zugriff auf die Kamera'
            : 'We need access to the camera'}
        </Text>
        <UIButton onPress={requestPermission}>
          {language === 'de'
            ? 'Zugriff auf Kamera erlauben'
            : 'Allow access to camera'}
        </UIButton>
      </View>
    );
  }

  if (isScanCorrect) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.question}>
          QR Code erfolgreich gescannt!
        </Text>
        <UIButton onPress={() => submitResult(true)}>Weiter</UIButton>
      </View>
    );
  }

  return (
    <View
      contentContainerStyle={globalStyles.default.refreshContainer}
      style={{
        backgroundColor: isDarkMode
          ? Colors.darkMode.background
          : Colors.lightMode.background,
      }}
    >
      <View
        style={[
          globalStyles.default.container,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        <View
          style={[
            globalStyles.rallyeStatesStyles.infoBox,
            {
              backgroundColor: isDarkMode
                ? Colors.darkMode.card
                : Colors.lightMode.card,
            },
          ]}
        >
          <Text
            style={[
              globalStyles.rallyeStatesStyles.infoTitle,
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
              },
            ]}
          >
            {currentQuestion.question}
          </Text>
        </View>

        {scanMode && (
          <View
            style={[
              globalStyles.qrCodeStyles.cameraBox,
              {
                backgroundColor: isDarkMode
                  ? Colors.darkMode.card
                  : Colors.lightMode.card,
              },
            ]}
          >
            <CameraView
              ref={cameraRef}
              style={[
                globalStyles.qrCodeStyles.camera,
                {
                  backgroundColor: isDarkMode
                    ? Colors.darkMode.card
                    : Colors.lightMode.card,
                },
              ]}
              onBarcodeScanned={handleQRCode}
            />
          </View>
        )}

        <View
          style={[
            globalStyles.rallyeStatesStyles.infoBox,
            {
              backgroundColor: isDarkMode
                ? Colors.darkMode.card
                : Colors.lightMode.card,
            },
          ]}
        >
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

        {currentQuestion.hint && <Hint hint={currentQuestion.hint} />}
      </View>
    </View>
  );
}
