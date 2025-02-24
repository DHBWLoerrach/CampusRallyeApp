import { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { TouchableOpacity } from "react-native";
import { store$ } from "../../services/storage/Store";
import Colors from "../../utils/Colors";
import { globalStyles } from "../../utils/GlobalStyles";
import { confirmAlert } from "../../utils/ConfirmAlert";
import Hint from "../../ui/Hint";
import UIButton from "../../ui/UIButton";
import { saveAnswer } from "../../services/storage/answerStorage";

export default function MultipleChoiceQuestions() {
  const [answer, setAnswer] = useState("");
  const currentQuestion = store$.currentQuestion.get();
  const currentAnswer = store$.currentAnswer.get();

  const handleNext = async () => {
    const correctlyAnswered =
          answer.trim() === currentAnswer.text.toLowerCase();
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
