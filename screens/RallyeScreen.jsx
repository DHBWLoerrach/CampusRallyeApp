import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, ScrollView, RefreshControl, Alert, Text } from 'react-native';
import { observer } from '@legendapp/state/react';
import { store$ } from '../services/storage/Store';
import NetInfo from '@react-native-community/netinfo';
import SkillQuestions from './questions/SkillQuestions';
import UploadQuestions from './questions/UploadQuestions';
import QRCodeQuestions from './questions/QRCodeQuestions';
import MultipleChoiceQuestions from './questions/MultipleChoiceQuestions';
import ImageQuestions from './questions/ImageQuestions';
import * as RallyeStates from './RallyeStates';
import { globalStyles } from '../utils/GlobalStyles';
import { supabase } from '../utils/Supabase';
import { saveTeamAnswer, getRallyeAndQuestionsAndAnswers } from '../services/storage/RallyeStorageManager';

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
      const questionsData = await getRallyeAndQuestionsAndAnswers(rallye.id);
      if (questionsData.length === 0) {
        store$.questions.set([]);
        store$.currentQuestion.set(null);
        return;
      }

      // Zufällige Reihenfolge per Fisher-Yates-Shuffle
      const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      const randomizedQuestions = shuffleArray(questionsData);
      console.log("Randomized questions:", randomizedQuestions);

      store$.questions.set(randomizedQuestions);
      store$.currentQuestion.set(randomizedQuestions[store$.questionIndex.get() || 0]);
    } catch (error) {
      console.error("Fehler beim Laden der Fragen:", error);
      Alert.alert("Fehler", "Die Fragen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rallye && team) {
      loadQuestions();
    }
  }, [rallye, team]);

  // Speichert die Antwort und leitet zur nächsten Frage weiter
  const handleAnswer = async (answered_correctly, answerPoints) => {
    try {
      if (answered_correctly) {
        store$.points.set(points + answerPoints);
      }
      if (team && currentQuestion) {
        await saveTeamAnswer(rallye.id, currentQuestion.id, answered_correctly ? currentQuestion.answer : "", store$.questionIndex.get());
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
              if (team && currentQuestion) {
                await saveTeamAnswer(rallye.id, currentQuestion.id, "", store$.questionIndex.get());
              }
              store$.gotoNextQuestion();
            } catch (error) {
              console.error("Fehler beim Aufgeben:", error);
              Alert.alert("Fehler", "Beim Aufgeben ist ein Fehler aufgetreten.");
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
      <RallyeStates.NoQuestionsAvailableState loading={loading} onRefresh={onRefresh} />
    );
  }

  if (questions.length > 0 && !allQuestionsAnswered) {
    const questionType = currentQuestion?.question_type;
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
          <QuestionComponent onAnswer={handleAnswer} question={currentQuestion} />
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
