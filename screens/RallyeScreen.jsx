import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { observer } from '@legendapp/state/react';
import { currentTime } from '@legendapp/state/helpers/time';
import { store$ } from '../utils/Store';
import { supabase } from '../utils/Supabase';
import SkillQuestions from './questions/SkillQuestions';
import UploadQuestions from './questions/UploadQuestions';
import QRCodeQuestions from './questions/QRCodeQuestions';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/GlobalStyles';
import MultipleChoiceQuestions from './questions/MultipleChoiceQuestions';
import ImageQuestions from './questions/ImageQuestions';
import * as RallyeStates from './RallyeStates';
import NetInfo from '@react-native-community/netinfo';

const questionTypeComponents = {
  knowledge: SkillQuestions,
  upload: UploadQuestions,
  qr: QRCodeQuestions,
  multiple_choice: MultipleChoiceQuestions,
  picture: ImageQuestions,
};

// Konstanten für Rallye-Status
const RALLYE_STATUS = {
  RUNNING: 'running'
};

// Hilfsfunktion zum Mischen eines Arrays
function shuffleArray(arr) {
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


const RallyeScreen = observer(function RallyeScreen() {
  const [loading, setLoading] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const questions = store$.questions.get();
  const currentQuestion = store$.currentQuestion.get();
  const points = store$.points.get();
  const allQuestionsAnswered = store$.allQuestionsAnswered.get();
  const currentTime$ = currentTime.get();

  const onRefresh = React.useCallback(async () => {
    if (rallye) {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        alert("Keine Internetverbindung verfügbar");
        return;
      }

      setLoading(true);
      try {
        const { data } = await supabase
          .from("rallye")
          .select("*")
          .eq("is_active_rallye", true);
        const rallyeFromDB = data[0];
        if (rallyeFromDB && rallyeFromDB.status !== rallye.status) {
          if (rallyeFromDB.end_time) {
            rallyeFromDB.end_time = new Date(rallyeFromDB.end_time);
          }
          store$.rallye.set(rallyeFromDB);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!rallye) return;

    if (rallye.status === 'running') {
      if (team !== null) {
        const fetchData = async () => {
          let { data } = await supabase.rpc('get_questions', {
            group_id: team.id,
          });
          if (data) {
            temp = data.filter(
              (item) => item.question_type !== 'multiple_choice'
            );
            multiple_choice_parent = data.filter(
              (item) =>
                item.question_type === 'multiple_choice' &&
                item.parent_id === null
            );
            multiple_choice_child = data.filter(
              (item) =>
                item.question_type === 'multiple_choice' &&
                item.parent_id !== null
            );

            for (
              let index = 0;
              index < multiple_choice_parent.length;
              index++
            ) {
              const element = multiple_choice_parent[index];
              childs = multiple_choice_child.filter(
                (item) => item.parent_id === element.id
              );
              const childAnswers = childs.map(
                (child) => child.answer
              );
              element.multiple_answer = childAnswers;
            }
            data = temp.concat(multiple_choice_parent);

            // upload questions shall always be at the end
            // Partition the array into non-upload and upload questions
            const nonUploadQuestions = data.filter(
              (question) => question.question_type !== 'upload'
            );
            const uploadQuestions = data.filter(
              (question) => question.question_type === 'upload'
            );
            // Shuffle the non-upload questions using Fisher-Yates algorithm
            for (let i = nonUploadQuestions.length - 1; i > 0; i--) {
              // Generate a random index from 0 to i
              const j = Math.floor(Math.random() * (i + 1));
              // Swap elements at indices i and j
              [nonUploadQuestions[i], nonUploadQuestions[j]] = [
                nonUploadQuestions[j],
                nonUploadQuestions[i],
              ];
            }
            // append upload questions at the end
            data = nonUploadQuestions.concat(uploadQuestions);
          }
          store$.questions.set(data);
          setLoading(false);
        };

        fetchData();
      }
    }
  }, [rallye, team]);

  useEffect(() => {
    if (!rallye || !team) {
      return;
    }
    const fetchData = async () => {
      let { data } = await supabase.rpc('get_points', {
        group_id_param: team.id,
      });
      store$.points.set(data);
    };
    fetchData();
  }, [rallye, currentQuestion]);

  useEffect(() => {
    if (rallye) return;
    setLoading(true);
    const fetchData = async () => {
      let { data } = await supabase
        .from('question')
        .select('*')
        .eq('enabled', true)
        .neq('question_type', 'upload');

      if (!data) {
        setLoading(false);
        return;
      }

      temp = data.filter(
        (item) => item.question_type !== 'multiple_choice'
      );
      multiple_choice_parent = data.filter(
        (item) =>
          item.question_type === 'multiple_choice' &&
          item.parent_id === null
      );
      multiple_choice_child = data.filter(
        (item) =>
          item.question_type === 'multiple_choice' &&
          item.parent_id !== null
      );

      for (
        let index = 0;
        index < multiple_choice_parent.length;
        index++
      ) {
        const element = multiple_choice_parent[index];
        childs = multiple_choice_child.filter(
          (item) => item.parent_id === element.id
        );
        const childAnswers = childs.map((child) => child.answer);
        // Antwortoptionen mischen
        element.multiple_answer = shuffleArray([...childAnswers]);
      }

      data = temp.concat(multiple_choice_parent);
      data = shuffleArray([...data]);
      store$.questions.set(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={globalStyles.default.container}>
        <ActivityIndicator size="large" color={Colors.dhbwRed} />
      </View>
    );
  }

  if (!rallye) {
    // exploration mode (Erkundungsmodus ohne Rallye)
    if (questions.length === 0) {
      return (
        <RallyeStates.NoQuestionsAvailableState
          loading={loading}
          onRefresh={onRefresh}
        />
      );
    }
    if (allQuestionsAnswered) {
      return (
        <RallyeStates.ExplorationFinishedState
          points={points}
          goBackToLogin={() => {
            store$.points.set(0);
            store$.enabled.set(false);
            store$.questionIndex.set(0);
            store$.allQuestionsAnswered.set(false);
          }}
        />
      );
    }
    const QuestionComponent =
      questionTypeComponents[currentQuestion.question_type];
    return (
      <View style={globalStyles.default.container}>
        <QuestionComponent />
      </View>
    );
  }

  if (rallye.status === 'preparation') {
    return (
      <RallyeStates.PreparationState
        loading={loading}
        onRefresh={onRefresh}
      />
    );
  }

  if (rallye.status === 'post_processing') {
    return (
      <RallyeStates.PostProcessingState
        loading={loading}
        onRefresh={onRefresh}
      />
    );
  }

  if (rallye.status === 'ended') {
    return <RallyeStates.EndedState />;
  }

  // Rendert den entsprechenden Zustand der Rallye basierend auf verschiedenen Bedingungen
  if (rallye.status === RALLYE_STATUS.RUNNING) {
    // Prüfe ob die Zeit abgelaufen ist
    if (currentTime$ >= rallye.end_time) {
      return (
        <RallyeStates.TimeExpiredState
          loading={loading}
          onRefresh={onRefresh}
          points={points}
          teamName={team?.name}
        />
      );
    }

    // Prüfe ob ein Team ausgewählt wurde
    if (!team) {
      return <RallyeStates.TeamNotSelectedState />;
    }

    // Prüfe ob alle Fragen beantwortet wurden oder keine Fragen vorhanden sind
    if (!questions.length || allQuestionsAnswered) {
      return (
        <RallyeStates.AllQuestionsAnsweredState
          loading={loading}
          onRefresh={onRefresh}
          points={points}
          teamName={team.name}
        />
      );
    }

    // Rendere die aktuelle Frage mit dem entsprechenden Komponententyp
    const QuestionComponent = questionTypeComponents[currentQuestion.question_type];
    return (
      <View style={globalStyles.default.container}>
        <QuestionComponent />
      </View>
    );
  }

  // Kein gültiger Rallye-Status
  return null;
});

export default RallyeScreen;
