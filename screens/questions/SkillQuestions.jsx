import { useState, useContext } from "react";
import { View, Text, TextInput, Alert, ScrollView } from "react-native";
import { store$ } from "../../services/storage/Store";
import UIButton from "../../ui/UIButton";
import Colors from "../../utils/Colors";
import { globalStyles } from "../../utils/GlobalStyles";
import { confirmAlert } from "../../utils/ConfirmAlert";
import Hint from "../../ui/Hint";
import { saveAnswer } from "../../services/storage/answerStorage";
import { ThemeContext } from "../../utils/ThemeContext";
import { useLanguage } from "../../utils/LanguageContext"; // Import LanguageContext

export default function SkillQuestions() {
  const [answer, setAnswer] = useState("");
  const currentQuestion = store$.currentQuestion.get();
  const currentAnswer = store$.currentAnswer.get();
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  const handleNext = async () => {
    const correctly_answered =
      answer.trim().toLowerCase() === currentAnswer.text.toLowerCase();

    if (correctly_answered) {
      store$.points.set(store$.points.get() + currentQuestion.points);
    }

    // Speichere die Antwort über den saveAnswer Service
    const team = store$.team.get();
    if (team && currentQuestion) {
      await saveAnswer(
        team.id,
        currentQuestion.id,
        correctly_answered,
        correctly_answered ? currentQuestion.points : 0,
        answer
      );
    }

    store$.gotoNextQuestion();
    setAnswer("");
  };

  const handleAnswerSubmit = () => {
    if (answer.trim() === "") {
      Alert.alert(
        language === 'de' ? "Fehler" : "Error",
        language === 'de' ? "Bitte gebe eine Antwort ein." : "Please enter an answer."
      );
      return;
    }

    confirmAlert(
      language === 'de' ? "Antwort bestätigen" : "Confirm answer",
      language === 'de' ? "Bist du sicher, dass du diese Antwort einreichen möchtest?" : "Are you sure you want to submit this answer?",
      handleNext
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[globalStyles.default.refreshContainer, { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }]}
    >
      <View style={[globalStyles.default.container, { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }]}>
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
          <TextInput
            style={[
              globalStyles.skillStyles.input,
              { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text, borderColor: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
            ]}
            value={answer}
            onChangeText={(text) => setAnswer(text.trim())}
            placeholder={language === 'de' ? "Deine Antwort..." : "Your answer..."}
            placeholderTextColor={isDarkMode ? Colors.darkMode.text : Colors.lightMode.text}
          />
        </View>

        <View style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}>
          <UIButton
            color={answer.trim() ? Colors.dhbwRed : Colors.dhbwGray}
            disabled={!answer.trim()}
            onPress={handleAnswerSubmit}
          >
            {language === 'de' ? "Antwort senden" : "Submit answer"}
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
