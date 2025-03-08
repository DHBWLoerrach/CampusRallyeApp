import { useState, useContext } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity } from "react-native";
import { store$ } from "../../services/storage/Store";
import Colors from "../../utils/Colors";
import { globalStyles } from "../../utils/GlobalStyles";
import { confirmAlert } from "../../utils/ConfirmAlert";
import Hint from "../../ui/Hint";
import UIButton from "../../ui/UIButton";
import { saveAnswer } from "../../services/storage/answerStorage";
import { ThemeContext } from "../../utils/ThemeContext";

export default function MultipleChoiceQuestions() {
  const [answer, setAnswer] = useState("");
  const currentQuestion = store$.currentQuestion.get();
  const currentAnswer = store$.currentAnswer.get();
  const currentMultipleChoiceAnswers = store$.currentMultipleChoiceAnswers.get();
  const team = store$.team.get();
  const { isDarkMode } = useContext(ThemeContext);

  const handleNext = async () => {
    const correctlyAnswered =
      answer.trim().toLowerCase() === currentAnswer.text.toLowerCase();
    if (correctlyAnswered) {
      store$.points.set(store$.points.get() + currentQuestion.points);
    }
    await saveAnswer(
      team.id,
      currentQuestion.id,
      correctlyAnswered,
      correctlyAnswered ? currentQuestion.points : 0,
      answer
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
      style={{ backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }}
    >
      <View style={globalStyles.default.container}>
        <View style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}>
          <Text style={[
            globalStyles.rallyeStatesStyles.infoTitle,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}>
            {currentQuestion.question}
          </Text>
        </View>

        <View style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}>
          {currentMultipleChoiceAnswers &&
            currentMultipleChoiceAnswers.map((option) => (
              <TouchableOpacity
                key={Math.random()}
                style={[
                  globalStyles.multipleChoiceStyles.squareButton,
                  {
                    borderColor:
                      answer === option.text
                        ? Colors.dhbwRed
                        : isDarkMode ? Colors.darkMode.text : Colors.dhbwGray,
                  },
                ]}
                onPress={() => setAnswer(option.text)}
              >
                <View
                  style={[
                    globalStyles.multipleChoiceStyles.innerSquare,
                    {
                      backgroundColor:
                        answer === option.text ? Colors.dhbwRed : isDarkMode ? Colors.darkMode.card : "white",
                    },
                  ]}
                />
                <Text style={[
                  globalStyles.multipleChoiceStyles.answerText,
                  { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
                ]}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        <View style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}>
          <UIButton
            color={answer ? Colors.dhbwRed : Colors.dhbwGray}
            disabled={!answer}
            onPress={handleAnswerSubmit}
          >
            Antwort senden
          </UIButton>
        </View>
      </View>
      {currentQuestion.hint && (
        <View style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}>
          <Hint hint={currentQuestion.hint} />
        </View>
      )}
    </ScrollView>
  );
}
