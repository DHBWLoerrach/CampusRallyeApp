import { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, Image, ScrollView, Alert } from "react-native";
import { store$ } from "../../services/storage/Store";
import { saveAnswer } from "../../services/storage/answerStorage";
import Colors from "../../utils/Colors";
import { globalStyles } from "../../utils/GlobalStyles";
import { confirmAlert } from "../../utils/ConfirmAlert";
import UIButton from "../../ui/UIButton";
import Hint from "../../ui/Hint";
import { supabase } from "../../utils/Supabase";
import { ThemeContext } from "../../utils/ThemeContext";
import { useLanguage } from "../../utils/LanguageContext"; // Import LanguageContext

export default function ImageQuestions() {
  const currentQuestion = store$.currentQuestion.get();
  const currentAnswer = store$.currentAnswer.get();
  const team = store$.team.get();
  const [answer, setAnswer] = useState("");
  const [pictureUri, setPictureUri] = useState("https://dhbw-loerrach.de/fileadmin/standards_homepage/images_header/header_bereiche-und-einrichtungen/Wir_ueber_uns.jpg");
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  useEffect(() => {
    getPictureUri();
  }, []);

  const getPictureUri = async () => {
    const bucket = "test";
    const { data, error } = supabase.storage
      .from(bucket)
      .getPublicUrl(currentQuestion.bucket_path);
    if (error) {
      console.error(language === 'de' ? "Fehler beim Abrufen der Bild-URL:" : "Error fetching image URL:", error);
      return;
    }
    setPictureUri(data.publicUrl);
  }

  // Vergleicht die Antwort, speichert das Ergebnis und leitet zur nächsten Frage weiter
  const handleNext = async () => {
    const correctlyAnswered =
      answer.trim().toLowerCase() === currentAnswer.text.toLowerCase();
    console.log(correctlyAnswered);

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

  // Validiert die Eingabe, zeigt ggf. einen Bestätigungsdialog und ruft handleNext auf
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
          <Image
            source={{
              uri: pictureUri,
            }}
            style={{
              height: "100%",
              borderRadius: 10,
              paddingVertical: 10,
            }}
            resizeMode="contain"
          />
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
            onChangeText={(text) => setAnswer(text)}
            placeholder={language === 'de' ? "Deine Antwort..." : "Your answer..."}
            placeholderTextColor={isDarkMode ? Colors.darkMode.text : Colors.lightMode.text}
          />
        </View>

        <View style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}>
          <UIButton
            color={answer.trim() !== "" ? Colors.dhbwRed : Colors.dhbwGray}
            disabled={answer.trim() === ""}
            onPress={handleAnswerSubmit}
          >
            {language === 'de' ? "Antwort senden" : "Submit answer"}
          </UIButton>
        </View>

        {currentQuestion.hint && (
          <View style={[
            globalStyles.rallyeStatesStyles.infoBox,
            { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
          ]}>
            <Hint hint={currentQuestion.hint} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
