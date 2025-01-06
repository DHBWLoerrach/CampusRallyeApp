import { useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { store$ } from '../../utils/Store';
import { globalStyles } from '../../utils/Styles';
import UIButton from '../../ui/UIButton';
import Hint from '../../ui/Hint';

export default function QRCodeQuestions() {
  const cameraRef = useRef(null);
  const [scanMode, setScanMode] = useState(false);
  const [isScanCorrect, setScanCorrect] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const currentQuestion = store$.currentQuestion.get();

  submitResult = async (isCorrect) => {
    await store$.savePoints(isCorrect, currentQuestion.points);
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
          onPress: () => submitResult(false),
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
      setScanCorrect(true);
    }
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={globalStyles.container}>
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
    <View style={styles.container}>
      <Text style={globalStyles.question}>
        {currentQuestion.question}
      </Text>
      <View style={styles.buttonRow}>
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
          style={styles.camera}
          onBarcodeScanned={handleQRCode}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 20,
  },
  camera: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').width * 0.8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 30,
    rowGap: 10,
    marginBottom: 30,
  },
});
