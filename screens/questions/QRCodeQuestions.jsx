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
import { supabase } from '../../utils/Supabase';
import { useSetPoints } from '../../utils/Points';
import { useSharedStates } from '../../utils/SharedStates';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/Styles';
import IconButton from '../../ui/IconButton';

export default function QRCodeQuestions() {
  const cameraRef = useRef(null);
  const [scanMode, setScanMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const {
    questions,
    currentQuestion,
    setCurrentQuestion,
    group,
    useRallye,
  } = useSharedStates();
  const setPoints = useSetPoints();

  submitSurrender = () => {
    setCurrentQuestion(currentQuestion + 1);
    setPoints(false, questions[currentQuestion].points);
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
    if (questions[currentQuestion].answer !== data) {
      alert(
        `Der Barcode ist falsch! Du bist vermutlich nicht am richtigen Ort.`
      );
      setScanMode(false);
    } else if (questions[currentQuestion].answer === data) {
      setCurrentQuestion(currentQuestion + 1);
      setPoints(true, questions[currentQuestion].points);
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

  return (
    <View style={styles.container}>
      <Text style={styles.question}>
        {questions[currentQuestion].question}
      </Text>
      <View style={styles.buttonRow}>
        <IconButton
          icon={scanMode ? 'circle-stop' : 'qrcode'}
          label={scanMode ? 'Kamera ausblenden' : 'QR-Code scannen'}
          color={Colors.dhbwRed}
          onPress={() => setScanMode(!scanMode)}
        />
        <IconButton
          icon="face-frown-open"
          label="Aufgeben"
          color={Colors.dhbwRed}
          onPress={handleSurrender}
        />
      </View>
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
    gap: 30,
    marginBottom: 30,
  },
  question: {
    fontSize: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
});
