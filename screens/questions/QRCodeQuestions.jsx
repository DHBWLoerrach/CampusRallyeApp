import { useRef, useState } from "react";
import { Alert, Button, Text, View, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { store$ } from "../../services/storage/Store";
import { globalStyles } from "../../utils/GlobalStyles";
import UIButton from "../../ui/UIButton";
import Hint from "../../ui/Hint";
import Colors from "../../utils/Colors";
import { saveAnswer } from "../../services/storage/answerStorage";

export default function QRCodeQuestions() {
  const cameraRef = useRef(null);
  const [scanMode, setScanMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const currentQuestion = store$.currentQuestion.get();
  const [isProcessing, setIsProcessing] = useState(false);

  const submitSurrender = async () => {
    setScanMode(false);
    try {
      const team = store$.team.get();
      if (team && currentQuestion) {
        await saveAnswer(team.id, currentQuestion.id, false, 0);
      }
      store$.gotoNextQuestion();
    } catch (error) {
      console.error("Fehler beim Aufgeben:", error);
      Alert.alert("Fehler", "Beim Aufgeben ist ein Fehler aufgetreten.");
    }
  };

  const handleSurrender = () => {
    Alert.alert(
      "Sicherheitsfrage",
      `Willst du diese Aufgabe wirklich aufgeben?`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Ja, ich möchte aufgeben",
          onPress: submitSurrender,
        },
      ]
    );
  };

  const handleQRCode = ({ data }) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      console.log(currentQuestion.answer);
      console.log(data);

      if (currentQuestion.answer !== data) {
        alert(
          `Der QR-Code ist falsch! Du bist vermutlich nicht am richtigen Ort.`
        );
        setScanMode(false);
      } else if (currentQuestion.answer === data) {
        setScanMode(false);
        Alert.alert("OK", `Das ist der richtige QR-Code!`, [
          {
            text: "Weiter",
            onPress: async () => {
              await store$.savePoints(true, currentQuestion.points);
              store$.gotoNextQuestion();
            },
          },
        ]);
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
      <View style={globalStyles.default.container}>
        <Text style={{ textAlign: "center", marginBottom: 10 }}>
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
    <View
      contentContainerStyle={globalStyles.default.refreshContainer}
      style={{ backgroundColor: "white" }}
    >
      <View style={globalStyles.default.container}>
        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
            {currentQuestion.question}
          </Text>
        </View>

        {scanMode && (
          <View style={globalStyles.qrCodeStyles.cameraBox}>
            <CameraView
              ref={cameraRef}
              style={globalStyles.qrCodeStyles.camera}
              onBarcodeScanned={handleQRCode}
            />
          </View>
        )}

        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <View style={globalStyles.qrCodeStyles.buttonRow}>
            <UIButton
              icon={scanMode ? "circle-stop" : "qrcode"}
              onPress={() => setScanMode(!scanMode)}
            >
              {scanMode ? "Kamera ausblenden" : "QR-Code scannen"}
            </UIButton>
            <UIButton
              icon="face-frown-open"
              color={Colors.dhbwGray}
              onPress={handleSurrender}
            >
              Aufgeben
            </UIButton>
          </View>

        </View>
        {currentQuestion.hint && (
          <Hint hint={currentQuestion.hint} />
        )}
      </View>
    </View>
  );
}
