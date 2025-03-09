import React, { useState, useEffect, useContext } from "react";
import {
  View,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Text,
} from "react-native";
import { observer } from "@legendapp/state/react";
import { store$ } from "../services/storage/Store";
import { saveAnswer } from "../services/storage/answerStorage";
import NetInfo from "@react-native-community/netinfo";
import SkillQuestions from "./questions/SkillQuestions";
import UploadPhoto from "./questions/UploadPhoto";
import QRCodeQuestions from "./questions/QRCodeQuestions";
import MultipleChoiceQuestions from "./questions/MultipleChoiceQuestions";
import ImageQuestions from "./questions/ImageQuestions";
import * as RallyeStates from "./RallyeStates";
import { globalStyles } from "../utils/GlobalStyles";
import { supabase } from "../utils/Supabase";
import Colors from "../utils/Colors";
import { ThemeContext } from "../utils/ThemeContext";
import { useLanguage } from "../utils/LanguageContext"; // Import LanguageContext

const questionTypeComponents = {
  knowledge: SkillQuestions,
  upload: UploadPhoto,
  qr_code: QRCodeQuestions,
  multiple_choice: MultipleChoiceQuestions,
  picture: ImageQuestions,
};

const RallyeScreen = observer(function RallyeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const questions = store$.questions.get();
  const currentQuestion = store$.currentQuestion.get();
  const points = store$.points.get();
  const allQuestionsAnswered = store$.allQuestionsAnswered.get();
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // 1. Hole aus der Join-Tabelle alle question_ids der aktuell ausgewählten Rallye
      const { data: joinData, error: joinError } = await supabase
        .from("join_rallye_questions")
        .select("question_id")
        .eq("rallye_id", rallye.id);

      if (joinError) throw joinError;

      const questionIds = joinData.map((row) => row.question_id);

      if (questionIds.length === 0) {
        store$.questions.set([]);
        store$.currentQuestion.set(null);
        return;
      }

      // 2. Hole bereits beantwortete Fragen des aktuellen Teams
      const { data: answeredData, error: answeredError } = await supabase
        .from("team_questions")
        .select("question_id")
        .eq("team_id", team.id);

      if (answeredError) throw answeredError;
      const answeredIds = answeredData.map((row) => row.question_id);

      // Filtere die Frage-IDs, die schon beantwortet wurden
      const filteredQuestionIds = questionIds.filter(
        (id) => !answeredIds.includes(id)
      );

      // 3. Lese die entsprechenden (unbeantworteten) Fragen aus der questions Tabelle aus
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .in("id", filteredQuestionIds);
      if (questionsError) throw questionsError;

      // Mapping der Felder für die UI
      const mappedQuestions = questionsData.map((q) => ({
        ...q,
        question: q.content,
        question_type: q.type,
      }));

      // Zufällige Reihenfolge
      const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      const randomizedQuestions = shuffleArray(mappedQuestions);

      store$.questions.set(randomizedQuestions);
      // Lade den persistierten Fragenindex (z.B. aus AsyncStorage) und setze currentQuestion.
      // Falls kein gespeicherter Index vorhanden: setze auf 0.
      store$.currentQuestion.set(
        randomizedQuestions[store$.questionIndex.get() || 0]
      );
    } catch (error) {
      console.error("Fehler beim Laden der Fragen:", error);
      Alert.alert(
        language === 'de' ? "Fehler" : "Error",
        language === 'de' ? "Die Fragen konnten nicht geladen werden." : "The questions could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAnswers = async () => {
    try {
      const { data: joinData, error: joinError } = await supabase
        .from("join_rallye_questions")
        .select("question_id")
        .eq("rallye_id", rallye.id);

      if (joinError) throw joinError;

      const questionIds = joinData.map((row) => row.question_id);

      if (joinError) {
        console.error("Error fetching rallye questions", joinError);
        return [];
      }

      const { data: answers, error: answerError } = await supabase
        .from("answers")
        .select("*")
        .in("question_id", questionIds);

      if (answerError) {
        console.error(
          "Error fetching answers for rallye",
          rallye.id,
          answerError
        );
        return [];
      }

      store$.answers.set(answers);
    } catch (error) {
      console.error("Error fetching rallye answers:", error);
      return [];
    }
  };

  const getRallyeStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("rallye")
        .select("status")
        .eq("id", rallye.id);

      if (error) throw error;

      if (data) {
        store$.rallye.status.set(data[0].status);
      }
    } catch (error) {
      console.error("Error fetching rallye status:", error);
    }
  };

  useEffect(() => {
    if (rallye && team) {
      loadQuestions();
    }
    if (questions) loadAnswers();
  }, [rallye, team]);

  // Speichert die Antwort und leitet zur nächsten Frage weiter
  const handleAnswer = async (answered_correctly, answerPoints) => {
    try {
      if (answered_correctly) {
        store$.points.set(points + answerPoints);
      }
      if (team && currentQuestion) {
        await saveAnswer(
          team.id,
          currentQuestion.id,
          answered_correctly,
          answered_correctly ? answerPoints : 0
        );
      }
      store$.gotoNextQuestion();
    } catch (error) {
      console.error("Fehler beim Speichern der Antwort:", error);
      Alert.alert(
        language === 'de' ? "Fehler" : "Error",
        language === 'de' ? "Antwort konnte nicht gespeichert werden." : "Answer could not be saved."
      );
    }
  };

  // Wird aufgerufen, wenn der Nutzer die Aufgabe aufgeben möchte
  const handleSurrender = () => {
    Alert.alert(
      language === 'de' ? "Aufgabe aufgeben" : "Surrender task",
      language === 'de' ? "Willst du diese Aufgabe wirklich aufgeben?" : "Do you really want to give up this task?",
      [
        {
          text: language === 'de' ? "Abbrechen" : "Cancel",
          style: "cancel",
        },
        {
          text: language === 'de' ? "Ja, aufgeben" : "Yes, give up",
          onPress: async () => {
            try {
              // Beim Aufgeben wird die Frage als falsch bewertet und es gibt keine Punktzahl
              if (team && currentQuestion) {
                await saveAnswer(team.id, currentQuestion.id, false, 0);
              }
              store$.gotoNextQuestion();
            } catch (error) {
              console.error("Fehler beim Aufgeben:", error);
              Alert.alert(
                language === 'de' ? "Fehler" : "Error",
                language === 'de' ? "Beim Aufgeben ist ein Fehler aufgetreten." : "An error occurred while giving up."
              );
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(
        language === 'de' ? "Fehler" : "Error",
        language === 'de' ? "Keine Internetverbindung verfügbar" : "No internet connection available"
      );
      return;
    }
    if (rallye.status === "running") {
      await loadQuestions();
      await loadAnswers();
      await getRallyeStatus();
      if (!team) {
        console.log("No team found, navigating to team screen");
        navigation.navigate("team");
      }
    } else {
      await getRallyeStatus();
    }
  };

  if (loading) {
    return (
      <View style={[
        globalStyles.default.container,
        { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
      ]}>
        <ActivityIndicator size="large" color={Colors.dhbwRed} />
      </View>
    );
  }

  if (!rallye) {
    return (
      <RallyeStates.NoQuestionsAvailableState
        loading={loading}
        onRefresh={onRefresh}
      />
    );
  }

  if (rallye.status === "preparing") {
    return (
      <RallyeStates.PreparationState loading={loading} onRefresh={onRefresh} />
    );
  }

  if (rallye.status === "post_processing") {
    return (
      <RallyeStates.PostProcessingState
        loading={loading}
        onRefresh={onRefresh}
      />
    );
  }

  if (rallye.status === "ended") {
    return (
      <RallyeStates.EndedState
        loading={loading}
        onRefresh={onRefresh}
        points={points}
        teamName={team?.name}
      />
    );
  }

  if (questions.length > 0 && !allQuestionsAnswered) {
    const questionType = currentQuestion?.question_type;
    console.log("questionType", questionType);
    const QuestionComponent = questionTypeComponents[questionType];
    if (!QuestionComponent) {
      return (
        <View style={[
          globalStyles.default.container,
          { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
        ]}>
          <Text style={{ color: "red", textAlign: "center" }}>
            {language === 'de' ? "Unbekannter Fragentyp" : "Unknown question type"}: {questionType}
          </Text>
        </View>
      );
    }
    return (
      <ScrollView
        contentContainerStyle={[globalStyles.default.refreshContainer, { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        <View style={[globalStyles.default.container, { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }]}>
          <QuestionComponent
            onAnswer={handleAnswer}
            question={currentQuestion}
            style={{ backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }}
          />
        </View>
      </ScrollView>
    );
  }

  if (allQuestionsAnswered) {
    return (
      <RallyeStates.AllQuestionsAnsweredState
        loading={loading}
        onRefresh={onRefresh}
        points={points}
        teamName={team.name}
        teamId={team.id}
        rallyeId={rallye.id}
      />
    );
  }

  return null;
});

export default RallyeScreen;
