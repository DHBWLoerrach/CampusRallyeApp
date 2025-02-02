import { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { TouchableOpacity } from "react-native";
import { store$ } from "../../utils/Store";
import Colors from "../../utils/Colors";
import { globalStyles } from "../../utils/GlobalStyles";
import { confirmAlert } from "../../utils/ConfirmAlert";
import Hint from "../../ui/Hint";
import UIButton from "../../ui/UIButton";

export default function MultipleChoiceQuestions() {
  const [answer, setAnswer] = useState("");
  const currentQuestion = store$.currentQuestion.get();

  const handleNext = async () => {
    correctly_answered = answer.trim() === currentQuestion.answer;
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
    // <ScrollView
    //   contentContainerStyle={globalStyles.default.refreshContainer}
    //   style={{ backgroundColor: 'white' }}
    // >
    <View style={globalStyles.default.container}>
      <View style={globalStyles.rallyeStatesStyles.infoBox}>
        <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
          {currentQuestion.question}
        </Text>
      </View>

      <View style={globalStyles.rallyeStatesStyles.infoBox}>
        {currentQuestion.multiple_answer.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              globalStyles.multipleChoiceStyles.squareButton,
              {
                borderColor:
                  answer === option ? Colors.dhbwRed : Colors.dhbwGray,
              },
            ]}
            onPress={() => setAnswer(option)}
          >
            <View
              style={[
                globalStyles.multipleChoiceStyles.innerSquare,
                {
                  backgroundColor: answer === option ? Colors.dhbwRed : "white",
                },
              ]}
            />
            <Text style={globalStyles.multipleChoiceStyles.answerText}>
              {option}
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

        {currentQuestion.hint && <Hint hint={currentQuestion.hint} />}
      </View>
    </View>
    // </ScrollView>
  );
}
