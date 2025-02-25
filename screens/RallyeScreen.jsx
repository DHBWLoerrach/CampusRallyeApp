import React, { useState, useEffect } from "react";
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
import UploadQuestions from "./questions/UploadQuestions";
import QRCodeQuestions from "./questions/QRCodeQuestions";
import MultipleChoiceQuestions from "./questions/MultipleChoiceQuestions";
import ImageQuestions from "./questions/ImageQuestions";
import * as RallyeStates from "./RallyeStates";
import { globalStyles } from "../utils/GlobalStyles";
import { supabase } from "../utils/Supabase";

const questionTypeComponents = {
  knowledge: SkillQuestions,
  upload: UploadQuestions,
  qr_code: QRCodeQuestions,
  multiple_choice: MultipleChoiceQuestions,
  picture: ImageQuestions,
};

const RallyeScreen = observer(function RallyeScreen() {
  const [loading, setLoading] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const questions = store$.questions.get();
  const currentQuestion = store$.currentQuestion.get();
  const points = store$.points.get();
  const allQuestionsAnswered = store$.allQuestionsAnswered.get();

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
        .from("teamQuestions")
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
      Alert.alert("Fehler", "Die Fragen konnten nicht geladen werden.");
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
        .in("question_id", questionIds)

      if (answerError) {
        console.error(
          "Error fetching answers for rallye",
          rallye.id,
          answerError
        );
        return [];
      }

      store$.answers.set(answers);
      await loadMultipleChoiceAnswers();
    } catch (error) {
      console.error("Error fetching rallye answers:", error);
      return [];
    }
  };

  const loadMultipleChoiceAnswers = async () => {
    try {
      // Alle Multiple-Choice-Frage-IDs sammeln
      const multipleChoiceQuestions = store$.questions.filter(
        (q) => q.question_type === "multiple_choice"
      );

      if (multipleChoiceQuestions.length === 0) {
        store$.multipleChoiceAnswers.set([3]);
        return;
      }

      // IDs extrahieren
      const multipleChoiceQuestionIds = multipleChoiceQuestions.map(
        (q) => q.id
      );

      // Alle Antworten für diese Fragen auf einmal laden
      const { data: answers, error } = await supabase
        .from("answers")
        .select("*")
        .in("question_id", multipleChoiceQuestionIds.id);

      if (error) {
        console.error("Error fetching multiple choice answers:", error);
        store$.multipleChoiceAnswers.set([1]);
        return;
      }

      // Die Antworten im Store speichern
      store$.multipleChoiceAnswers.set(answers || [2]);
    } catch (error) {
      console.error("Error fetching rallye answers:", error);
      store$.multipleChoiceAnswers.set([]);
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
      Alert.alert("Fehler", "Antwort konnte nicht gespeichert werden.");
    }
  };

  // Wird aufgerufen, wenn der Nutzer die Aufgabe aufgeben möchte
  const handleSurrender = () => {
    Alert.alert(
      "Aufgabe aufgeben",
      "Willst du diese Aufgabe wirklich aufgeben?",
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Ja, aufgeben",
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
                "Fehler",
                "Beim Aufgeben ist ein Fehler aufgetreten."
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
      Alert.alert("Fehler", "Keine Internetverbindung verfügbar");
      return;
    }
    await loadQuestions();
    await loadAnswers();
  };

  if (loading) {
    return (
      <View style={globalStyles.default.container}>
        <ActivityIndicator size="large" color="#000" />
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

  if (questions.length > 0 && !allQuestionsAnswered) {
    const questionType = currentQuestion?.question_type;
    console.log("questionType", questionType);
    const QuestionComponent = questionTypeComponents[questionType];
    if (!QuestionComponent) {
      return (
        <View style={globalStyles.default.container}>
          <Text style={{ color: "red", textAlign: "center" }}>
            Unbekannter Fragentyp: {questionType}
          </Text>
        </View>
      );
    }
    return (
      <ScrollView
        contentContainerStyle={globalStyles.default.refreshContainer}
        style={{ backgroundColor: "white" }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        <View style={globalStyles.default.container}>
          <QuestionComponent
            onAnswer={handleAnswer}
            question={currentQuestion}
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
      />
    );
  }

  return null;
});

export default RallyeScreen;
