import { useRef, useState } from 'react';
import {
  Alert,
  Button,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { store$ } from '../../utils/Store';
import { globalStyles } from '../../utils/GlobalStyles';
import UIButton from '../../ui/UIButton';
import Hint from '../../ui/Hint';

export default function QRCodeQuestions() {
  const cameraRef = useRef(null);
  const [scanMode, setScanMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const currentQuestion = store$.currentQuestion.get();

  submitSurrender = async () => {
    await store$.savePoints(false, currentQuestion.points);
    store$.gotoNextQuestion();
  };

  const handleSurrender = () => {
    Alert.alert(
      'Sicherheitsfrage',
      `Willst du diese Aufgabe wirklich aufgeben?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Ja, ich möchte aufgeben',
          onPress: () => submitSurrender(),
        },
      ]
    );
  };

  const handleQRCode = ({ data }) => {
    if (currentQuestion.answer !== data) {
      alert(
        `Der QR-Code ist falsch! Du bist vermutlich nicht am richtigen Ort.`
      );
      setScanMode(false);
    } else if (currentQuestion.answer === data) {
      setScanMode(false);
      Alert.alert('OK', `Das ist der richtige QR-Code!`, [
        {
          text: 'Weiter',
          onPress: async () => {
            await store$.savePoints(true, currentQuestion.points);
            store$.gotoNextQuestion();
          },
        },
      ]);
    }
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={globalStyles.default.container}>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>
          Wir brauchen Zugriff auf die Kamera
        </Text>
        <Button
          onPress={requestPermission}
          title="Zugriff auf Kamera erlauben"
        />
      </View>
    );
  }

  return (
    <View style={globalStyles.qrCodeStyles.container}>
      <Text style={globalStyles.default.question}>
        {currentQuestion.question}
      </Text>
      <View style={globalStyles.qrCodeStyles.buttonRow}>
        <UIButton
          icon={scanMode ? 'circle-stop' : 'qrcode'}
          onPress={() => setScanMode(!scanMode)}
        >
          {scanMode ? 'Kamera ausblenden' : 'QR-Code scannen'}
        </UIButton>
        <UIButton icon="face-frown-open" onPress={handleSurrender}>
          Aufgeben
        </UIButton>
      </View>
      {currentQuestion.hint && <Hint hint={currentQuestion.hint} />}
      {scanMode && (
        <CameraView
          ref={cameraRef}
          style={globalStyles.qrCodeStyles.camera}
          onBarcodeScanned={handleQRCode}
        />
      )}
    </View>
  );
}