import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { observer } from '@legendapp/state/react';
import { currentTime } from '@legendapp/state/helpers/time';
import { supabase } from '../utils/Supabase';
import SkillQuestions from './questions/SkillQuestions';
import UploadQuestions from './questions/UploadQuestions';
import QRCodeQuestions from './questions/QRCodeQuestions';
import { useSharedStates } from '../utils/SharedStates';
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
  // import shared states
  const {
    questions,
    setQuestions,
    currentQuestion,
    setCurrentQuestion,
    setEnabled,
    team,
    points,
    rallye,
    setRallye,
    setPoints,
  } = useSharedStates();
  const [loading, setLoading] = useState(false);
  const currentTime$ = currentTime.get();

  const onRefresh = React.useCallback(async () => {
    if (rallye) {
      setLoading(true);
      const { data: rallye } = await supabase
        .from('rallye')
        .select('*')
        .eq('is_active_rallye', true);
      if (rallye[0].status !== rallye.status) {
        setRallye(rallye[0]);
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!rallye) {
      return;
    }
    if (rallye.status === 'running') {
      if (team !== null) {
        const fetchData = async () => {
          let group_id = team;
          let { data } = await supabase.rpc('get_questions', {
            group_id,
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
            for (let i = data.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [data[i], data[j]] = [data[j], data[i]];
            }
          }
          setQuestions(data);
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
    if (rallye.status === 'running') {
      if (currentQuestion === null) {
        const fetchData = async () => {
          let group_id_param = team;
          let { data } = await supabase.rpc('get_points', {
            group_id_param,
          });

          setPoints(data);
        };
        fetchData();
      } else if (currentQuestion === questions.length) {
        const fetchData = async () => {
          let group_id_param = team;
          let { data, error } = await supabase.rpc('get_points', {
            group_id_param,
          });

          setPoints(data);
        };
        fetchData();
      }
    }
  }, [rallye, currentQuestion]);

  useEffect(() => {
    if (rallye) {
      return;
    }
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
      setQuestions(data);
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
    if (!questions || questions.length === 0) {
      return <RallyeStates.NoQuestionsAvailableState />;
    }
    if (
      !questions ||
      questions.length === 0 ||
      currentQuestion >= questions.length
    ) {
      return (
        <RallyeStates.ExplorationFinishedState
          points={points}
          goBackToLogin={() => {
            setEnabled(false);
            setPoints(0);
            setCurrentQuestion(0);
          }}
        />
      );
    }
    const QuestionComponent =
      questionTypeComponents[
        questions[currentQuestion].question_type
      ];
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

    if (
      !questions ||
      questions.length === 0 ||
      currentQuestion >= questions.length
    ) {
      return (
        <RallyeStates.AllQuestionsAnsweredState
          loading={loading}
          onRefresh={onRefresh}
          points={points}
        />
      );
    }

    const QuestionComponent =
      questionTypeComponents[
        questions[currentQuestion].question_type
      ];
    return (
      <View style={globalStyles.container}>
        <QuestionComponent />
      </View>
    );
  }

  return null;
});

export default RallyeScreen;
