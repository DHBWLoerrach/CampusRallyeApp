import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { supabase } from '../utils/Supabase';
import SkillQuestions from './questions/SkillQuestions';
import UploadQuestions from './questions/UploadQuestions';
import QRCodeQuestions from './questions/QRCodeQuestions';
import { useSharedStates } from '../utils/SharedStates';
import Colors from '../utils/Colors';
import Scoreboard from '../ui/Scoreboard';
import UIButton from '../ui/UIButton';
import MultipleChoiceQuestions from './questions/MultipleChoiceQuestions';
import ImageQuestions from './questions/ImageQuestions';
import VotingScreen from './Voting';

export default function RallyeScreen() {
  // import shared states
  const {
    questions,
    setQuestions,
    currentQuestion,
    setCurrentQuestion,
    group,
    points,
    useRallye,
    rallye,
    setRallye,
    setPoints,
    remainingTime,
    setEnabled,
  } = useSharedStates();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reloadRallye = async () => {
    const { data: rallye } = await supabase
      .from('rallye')
      .select('*')
      .eq('is_active_rallye', true);
    setRallye(rallye[0]);
  };

  const onRefresh = React.useCallback(() => {
    if (useRallye) {
      setRefreshing(true);
      reloadRallye().then(() => setRefreshing(false));
    }
  }, []);

  useEffect(() => {
    if (!useRallye) {
      return;
    }
    if (rallye.status == 'running') {
      if (group !== null) {
        const fetchData = async () => {
          let group_id = group;
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
  }, [rallye, group]);

  useEffect(() => {
    if (!useRallye) {
      return;
    }
    if (rallye.status == 'running') {
      if (currentQuestion === null) {
        const fetchData = async () => {
          let group_id_param = group;
          let { data } = await supabase.rpc('get_points', {
            group_id_param,
          });

          setPoints(data);
        };
        fetchData();
      } else if (currentQuestion === questions.length) {
        const fetchData = async () => {
          let group_id_param = group;
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
    if (useRallye) {
      return;
    }
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

  let content;
  if (useRallye) {
    if (
      !loading &&
      rallye.status === 'running' &&
      remainingTime >= 0 &&
      questions !== null &&
      currentQuestion < questions.length
    ) {
      if (questions[currentQuestion].question_type === 'knowledge') {
        content = <SkillQuestions />;
      } else if (
        questions[currentQuestion].question_type === 'upload'
      ) {
        content = <UploadQuestions />;
      } else if (questions[currentQuestion].question_type === 'qr') {
        content = <QRCodeQuestions />;
      } else if (
        questions[currentQuestion].question_type === 'multiple_choice'
      ) {
        content = <MultipleChoiceQuestions />;
      } else if (
        questions[currentQuestion].question_type === 'picture'
      ) {
        content = <ImageQuestions />;
      }
    } else if (useRallye && rallye.status === 'post_processing') {
      content = (
        <ScrollView
          contentContainerStyle={styles.refreshContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <VotingScreen />
        </ScrollView>
      );
    } else if (
      !loading &&
      rallye.status == 'running' &&
      remainingTime >= 0
    ) {
      content = (
        <ScrollView
          contentContainerStyle={styles.refreshContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <View>
            <Text style={styles.endText}>
              Ihr habt alle Fragen beantwortet, Glückwunsch!
            </Text>
            <Text style={styles.endText}>
              Wartet bis die Rallye beendet wird, um das Ergebnis zu
              sehen.
            </Text>
            <Text style={styles.endText}>
              Eure erreichte Punktzahl: {points}
            </Text>
            <Text style={styles.endText}>
              Geht zu eurem vereinbarten Treffpunkt.
            </Text>
          </View>
        </ScrollView>
      );
    } else if (
      !loading &&
      rallye.status == 'running' &&
      remainingTime < 0
    ) {
      content = (
        <ScrollView
          contentContainerStyle={styles.refreshContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <View>
            <Text style={styles.endText}>
              Die Zeit für die Rallye ist abgelaufen. Geht zum
              Treffpunkt.
            </Text>
            <Text style={styles.endText}>
              Wartet bis die Rallye beendet wird um das Ergebnis zu
              sehen.
            </Text>
            <Text style={styles.endText}>
              Eure erreichte Punktzahl: {points}
            </Text>
          </View>
        </ScrollView>
      );
    } else if (useRallye && loading && group === null) {
      content = (
        <View>
          <Text style={styles.groupSelectionText}>
            Bitte wähle zuerst eine Gruppe aus.
          </Text>
        </View>
      );
    } else if (useRallye && rallye.status == 'preparation') {
      content = (
        <ScrollView
          contentContainerStyle={styles.specialRefreshConatiner}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <Text style={styles.groupSelectionText}>
            Die Rallye hat noch nicht angefangen.
          </Text>
        </ScrollView>
      );
    } else if (rallye.status == 'ended') {
      content = Scoreboard();
    }
  } else {
    if (
      !loading &&
      questions !== null &&
      currentQuestion !== questions.length
    ) {
      if (questions[currentQuestion].question_type === 'knowledge') {
        content = <SkillQuestions />;
      } else if (questions[currentQuestion].question_type === 'qr') {
        content = <QRCodeQuestions />;
      } else if (
        questions[currentQuestion].question_type === 'multiple_choice'
      ) {
        content = <MultipleChoiceQuestions />;
      } else if (
        questions[currentQuestion].question_type === 'picture'
      ) {
        content = <ImageQuestions />;
      }
    } else if (!loading) {
      content = (
        <View style={styles.container}>
          <Text style={styles.endText}>
            Alle Fragen wurden beantwortet.
          </Text>
          <Text style={styles.endText}>
            Erreichte Punktzahl: {points}
          </Text>
          <UIButton
            size="small"
            onClick={() => {
              setEnabled(false);
              setPoints(0);
              setCurrentQuestion(0);
            }}
          >
            Zurück zur Anmeldung
          </UIButton>
        </View>
      );
    }
  }
  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  tile: {
    width: '80%',
    height: 100,
    marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'grey',
    paddingBottom: 7,
  },
  tileText: {
    fontSize: 20,
    color: 'grey',
    textAlign: 'center',
  },
  endText: {
    fontSize: 30,
    color: 'grey',
    textAlign: 'center',
    paddingBottom: 7,
  },
  buttonContainer: {
    alignSelf: 'center',
    backgroundColor: Colors.dhbwRed,
    margin: 6,
    borderRadius: 5,
  },
  buttonContainerDeactive: {
    alignSelf: 'center',
    backgroundColor: Colors.dhbwGray,
    margin: 6,
    borderRadius: 5,
  },
  groupSelectionText: {
    color: Colors.dhbwGray,
    fontSize: 30,
    textAlign: 'center',
  },
  refreshContainer: {
    flexGrow: 1,
  },
  specialRefreshConatiner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
