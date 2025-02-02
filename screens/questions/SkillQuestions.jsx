import { useState } from "react";
import { View, Text, TextInput, Alert, ScrollView } from "react-native";
import { store$ } from "../../utils/Store";
import UIButton from "../../ui/UIButton";
import Colors from "../../utils/Colors";
import { globalStyles } from "../../utils/GlobalStyles";
import { confirmAlert } from "../../utils/ConfirmAlert";
import Hint from "../../ui/Hint";

export default function SkillQuestions() {
  const [answer, setAnswer] = useState("");
  const currentQuestion = store$.currentQuestion.get();

  const handleNext = async () => {
    correctly_answered =
      answer.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
    await store$.savePoints(correctly_answered, currentQuestion.points);
    store$.gotoNextQuestion();
    setAnswer("");
  };

  const handleAnswerSubmit = () => {
    if (answer.trim() === "") {
      Alert.alert("Fehler", "Bitte gebe eine Antwort ein.");
      return;
    }

    confirmAlert(answer, handleNext);
  };

  return (
    <ScrollView
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
          <TextInput
            style={globalStyles.skillStyles.input}
            value={answer}
            onChangeText={(text) => setAnswer(text.trim())}
            placeholder="Deine Antwort..."
          />
        </View>

        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <UIButton
            color={answer.trim() ? Colors.dhbwRed : Colors.dhbwGray} 
            disabled={!answer.trim()} 
            onPress={handleAnswerSubmit}
          >
            Antwort senden
          </UIButton>

          {currentQuestion.hint && <Hint hint={currentQuestion.hint} />}
        </View>
      </View>
    </ScrollView>
  );
}
