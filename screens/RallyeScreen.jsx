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
import { globalStyles } from '../utils/Styles';
import MultipleChoiceQuestions from './questions/MultipleChoiceQuestions';
import ImageQuestions from './questions/ImageQuestions';
import * as RallyeStates from './RallyeStates';

const questionTypeComponents = {
  knowledge: SkillQuestions,
  upload: UploadQuestions,
  qr: QRCodeQuestions,
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
  const currentTime$ = currentTime.get();

  const onRefresh = React.useCallback(async () => {
    if (rallye) {
      setLoading(true);
      const { data } = await supabase
        .from('rallye')
        .select('*')
        .eq('is_active_rallye', true);
      const rallyeFromDB = data[0];
      if (rallyeFromDB && rallyeFromDB.status !== rallye.status) {
        if (rallyeFromDB.end_time) {
          rallyeFromDB.end_time = new Date(rallyeFromDB.end_time);
        }
        store$.rallye.set(rallyeFromDB);
      }
      setLoading(false);
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
    if (!rallye) {
      return;
    }
    if (rallye.status === 'running' && allQuestionsAnswered) {
      const fetchData = async () => {
        let { data } = await supabase.rpc('get_points', {
          group_id_param: team.id,
        });
        store$.points.set(data);
      };
      fetchData();
    }
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
        element.multiple_answer = childAnswers;
      }

      data = temp.concat(multiple_choice_parent);
      for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
      }
      store$.questions.set(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color={Colors.dhbwRed} />
      </View>
    );
  }

  if (!rallye) {
    // exploration mode (Erkundungsmodus ohne Rallye)
    if (questions.length === 0) {
      return <RallyeStates.NoQuestionsAvailableState />;
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
      <View style={globalStyles.container}>
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

  if (rallye.status === 'running') {
    if (currentTime$ >= rallye.end_time) {
      return (
        <RallyeStates.TimeExpiredState
          loading={loading}
          onRefresh={onRefresh}
          points={points}
        />
      );
    }

    if (team === null) {
      return <RallyeStates.TeamNotSelectedState />;
    }

    if (questions.length === 0 || allQuestionsAnswered) {
      return (
        <RallyeStates.AllQuestionsAnsweredState
          loading={loading}
          onRefresh={onRefresh}
          points={points}
        />
      );
    }

    const QuestionComponent =
      questionTypeComponents[currentQuestion.question_type];
    return (
      <View style={globalStyles.container}>
        <QuestionComponent />
      </View>
    );
  }

  return null;
});

export default RallyeScreen;
