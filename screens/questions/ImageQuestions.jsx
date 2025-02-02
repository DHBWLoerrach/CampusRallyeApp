import { useState } from "react";
import { View, Text, TextInput, Image, ScrollView } from "react-native";
import { store$ } from "../../utils/Store";
import Colors from "../../utils/Colors";
import { globalStyles } from "../../utils/GlobalStyles";
import { confirmAlert } from "../../utils/ConfirmAlert";
import UIButton from "../../ui/UIButton";
import Hint from "../../ui/Hint";

export default function ImageQuestions() {
  const [answer, setAnswer] = useState("");
  const currentQuestion = store$.currentQuestion.get();

  const handleNext = async () => {
    const correctly_answered = answer.trim() === currentQuestion.answer;
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
              // width: "90%",
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
            color={answer.trim() !== "" ? Colors.dhbwRed : Colors.dhbwGray} // Prüfe auf nicht-leeren String
            disabled={answer.trim() === ""} // Prüfe auf leeren String
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
