import { useState } from "react";
import { View, Text, TextInput, Image, ScrollView, Alert } from "react-native";
import { store$ } from "../../utils/Store";
import { saveAnswer } from "../../services/storage/answerStorage";
import Colors from "../../utils/Colors";
import { globalStyles } from "../../utils/GlobalStyles";
import { confirmAlert } from "../../utils/ConfirmAlert";
import UIButton from "../../ui/UIButton";
import Hint from "../../ui/Hint";

export default function ImageQuestions() {
  const currentQuestion = store$.currentQuestion.get();
  const team = store$.team.get();
  const [answer, setAnswer] = useState("");

  // Vergleicht die Antwort, speichert das Ergebnis und leitet zur nächsten Frage weiter
  const handleNext = async () => {
    const correctlyAnswered = answer.trim() === currentQuestion.answer;
    // Optional: Punkte aktualisieren
    if (correctlyAnswered) {
      store$.points.set(store$.points.get() + currentQuestion.points);
    }
    await saveAnswer(
      team.id,
      currentQuestion.id,
      correctlyAnswered,
      correctlyAnswered ? currentQuestion.points : 0
    );
    store$.gotoNextQuestion();
    setAnswer("");
  };

  // Validiert die Eingabe, zeigt ggf. einen Bestätigungsdialog und ruft handleNext auf
  const handleAnswerSubmit = () => {
    if (answer.trim() === "") {
      Alert.alert("Fehler", "Bitte gebe eine Antwort ein.");
      return;
    }
    confirmAlert(answer, handleNext);
  };

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

        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <Image
            source={{ uri: currentQuestion.uri }}
            style={{
              height: "100%",
              borderRadius: 10,
              paddingVertical: 10,
            }}
            resizeMode="contain"
          />
        </View>

        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <TextInput
            style={[globalStyles.skillStyles.input]}
            value={answer}
            onChangeText={(text) => setAnswer(text)}
            placeholder="Deine Antwort..."
          />
        </View>

        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <UIButton
            color={answer.trim() !== "" ? Colors.dhbwRed : Colors.dhbwGray}
            disabled={answer.trim() === ""}
            onPress={handleAnswerSubmit}
          >
            Antwort senden
          </UIButton>
        </View>

        {currentQuestion.hint && (
          <View style={globalStyles.rallyeStatesStyles.infoBox}>
            <Hint hint={currentQuestion.hint} />
          </View>
        )}
      </View>
    </View>
  );
}
