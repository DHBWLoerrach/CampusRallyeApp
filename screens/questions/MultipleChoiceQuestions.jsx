import { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { TouchableOpacity } from "react-native";
import { store$ } from "../../services/storage/Store";
import Colors from "../../utils/Colors";
import { globalStyles } from "../../utils/GlobalStyles";
import { confirmAlert } from "../../utils/ConfirmAlert";
import Hint from "../../ui/Hint";
import UIButton from "../../ui/UIButton";

export default function MultipleChoiceQuestions() {
  const [answer, setAnswer] = useState("");
  const currentQuestion = store$.currentQuestion.get();

  const handleNext = async () => {
    // Vergleiche die getroffene Antwort (kleinbuchstabig) mit der korrekten Antwort aus der DB
    const correctly_answered =
      answer.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
    await store$.savePoints(correctly_answered, currentQuestion.points);
    store$.gotoNextQuestion();
    setAnswer("");
  };

  const handleAnswerSubmit = () => {
    if (answer.trim() === "") {
      Alert.alert("Fehler", "Bitte wähle eine Antwort aus.");
      return;
    }
    // Zeige einen Bestätigungsdialog vor dem Absenden
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
          {currentQuestion.answers &&
            currentQuestion.answers.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  globalStyles.multipleChoiceStyles.squareButton,
                  {
                    borderColor:
                      answer === option.text ? Colors.dhbwRed : Colors.dhbwGray,
                  },
                ]}
                onPress={() => setAnswer(option.text)}
              >
                <View
                  style={[
                    globalStyles.multipleChoiceStyles.innerSquare,
                    {
                      backgroundColor:
                        answer === option.text ? Colors.dhbwRed : "white",
                    },
                  ]}
                />
                <Text style={globalStyles.multipleChoiceStyles.answerText}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <UIButton
            color={answer ? Colors.dhbwRed : Colors.dhbwGray}
            disabled={!answer}
            onPress={handleAnswerSubmit}
          >
            Antwort senden
          </UIButton>
        </View>
      </View>
          {currentQuestion.hint && <Hint hint={currentQuestion.hint} />}
    </ScrollView>
  );
}
