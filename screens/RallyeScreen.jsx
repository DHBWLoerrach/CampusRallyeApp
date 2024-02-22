import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../utils/Supabase';
import SkillQuestions from './questions/SkillQuestions';
import ImageQuestions from './questions/ImageQuestions';
import QRCodeQuestions from './questions/QRCodeQuestions';
import { useSharedStates } from '../utils/SharedStates';
import Colors from '../utils/Colors';
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion';

export default function RallyeScreen() {
  // import shared states
  const {
    questions,
    setQuestions,
    currentQuestion,
    group,
    points,
    useRallye,
    setPoints,
  } = useSharedStates();
  const [loading, setLoading] = useState(true);

  if (useRallye) {
    useEffect(() => {
      if (group !== null) {
        const fetchData = async () => {
          let group_id = group;
          console.log(group_id)
          let { data, error } = await supabase.rpc('get_questions', {
            group_id,
          });
          if(data){
            console.log("Data")
            temp = data.filter(item => item.question_type !== 'multiple_choice');
          multiple_choice_parent = data.filter(item => item.question_type === 'multiple_choice' && item.parent_id === null);
          multiple_choice_child = data.filter(item => item.question_type === 'multiple_choice' && item.parent_id !== null);

          for (let index = 0; index < multiple_choice_parent.length; index++) {
            const element = multiple_choice_parent[index];
            childs = multiple_choice_child.filter(item => item.parent_id === element.id)
            const childAnswers = childs.map(child => child.answer);
            element.multiple_answer = childAnswers;
          }
          
          data = temp.concat(multiple_choice_parent)
          console.log(data)
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
    }, [group]);

    useEffect(() => {
      if (currentQuestion === null ) {
        const fetchData = async () => {
          let group_id_param = group;
          let { data, error } = await supabase.rpc(
            'get_points',
            {
              group_id_param,
            }
          );

          setPoints(data);
        };
        fetchData();
      } else if(currentQuestion === questions.length) {
        const fetchData = async () => {
          let group_id_param = group;
          let { data, error } = await supabase.rpc(
            'get_points',
            {
              group_id_param,
            }
          );

          setPoints(data);
        };
        fetchData();
      }
    }, [currentQuestion]);
  } else {
    useEffect(() => {
      const fetchData = async () => {
        let { data } = await supabase
          .from('question')
          .select('*')
          .eq('enabled', true)
          .neq('question_type', 'picture');
          temp = data.filter(item => item.question_type !== 'multiple_choice');
          multiple_choice_parent = data.filter(item => item.question_type === 'multiple_choice' && item.parent_id === null);
          multiple_choice_child = data.filter(item => item.question_type === 'multiple_choice' && item.parent_id !== null);

          for (let index = 0; index < multiple_choice_parent.length; index++) {
            const element = multiple_choice_parent[index];
            childs = multiple_choice_child.filter(item => item.parent_id === element.id)
            const childAnswers = childs.map(child => child.answer);
            element.multiple_answer = childAnswers;
          }
          
          data = temp.concat(multiple_choice_parent)
        for (let i = data.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [data[i], data[j]] = [data[j], data[i]];
        }
        setQuestions(data);
        setLoading(false);
      };

      fetchData();
    }, []);
  }

  let content;
  if (!loading && questions !== null &&currentQuestion !== questions.length) {
    if (questions[currentQuestion].question_type === 'knowledge') {
      content = <SkillQuestions />;
    } else if (
      questions[currentQuestion].question_type === 'picture'
    ) {
      content = <ImageQuestions />;
    } else if (questions[currentQuestion].question_type === 'qr') {
      content = <QRCodeQuestions />;
    } else if (questions[currentQuestion].question_type === 'multiple_choice'){
      content = <MultipleChoiceQuestion/>;
    }
  } else if (!loading) {
    content = (
      <View>
        <Text style={styles.endText}>
          Die Rallye wurde erforderlich beendet!
        </Text>
        <Text style={styles.endText}>
          Eure erreichte Punktzahl: {points}
        </Text>
        {/* <Text style={styles.tileText}>
          Ladet gerne euren Gruppennamen und eure Punktzahl hoch, um
          im Ranking aufgenommen zu werden! Einfach auf 'Hochladen'
          klicken.
        </Text>
        <View>
          <View style={uploaded ? styles.buttonContainerDeactive : styles.buttonContainer}>
            <Button
              title="Hochladen"
              onPress={() => savePoints()}
              color="white"
              disabled={uploaded}
            />
          </View>

        </View> */}
      </View>
    );
  } else {
    content = (
      <View>
        <Text style={styles.groupSelectionText}>
          Bitte wähle zuerst eine Gruppe aus.
        </Text>
      </View>
    );
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
});
