import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { supabase } from '../utils/Supabase';
import SkillQuestions from './questions/SkillQuestions';
import ImageQuestions from './questions/ImageQuestions';
import QRCodeQuestions from './questions/QRCodeQuestions';
import { useSharedStates } from '../utils/SharedStates';
import Colors from '../utils/Colors';

export default function RallyeScreen() {
  // import shared states
  const { questions, setQuestions } = useSharedStates();
  const { currentQuestion,group } = useSharedStates();
  const { points,useRallye ,setPoints} = useSharedStates();
  const [loading, setLoading] = useState(true);
  const [uploaded, setUploaded] = useState(false);

  
  if(useRallye){
    useEffect(() => {
      if(group!== null){
        const fetchData = async () => {
          let group_id = group;
          let { data, error } = await supabase
            .rpc('get_questions', {
              group_id
            });
          for (let i = data.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data[i], data[j]] = [data[j], data[i]];
          }
    
          setQuestions(data);
          setLoading(false);
        };

        fetchData();
      }
    }, [group]); 


    useEffect(() => {
      if( currentQuestion === questions.length){
        const fetchData = async () =>{
          let p_group_id = group;
        let { data, error } = await supabase
          .rpc('get_correct_answers_count', {
            p_group_id
          });
          
        setPoints(data);
        }
        fetchData();
        
      }
    }, [currentQuestion]);
  } else{
    useEffect(() => {
      const fetchData = async () => {
        let { data } = await supabase.from('question').select('*').neq('question_type','picture');
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
  

  async function savePoints() {
    try {
      const updates = {
        Gruppenname: 'TODO',
        Punktzahl: points,
      };

      let { error } = await supabase.from('Gruppen').insert(updates);
      setUploaded(true);
      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    }
  }

  let content;
  if (!loading && currentQuestion !== questions.length) {
    if (questions[currentQuestion].question_type === 'knowledge') {
      content = <SkillQuestions />;
    } else if (questions[currentQuestion].question_type === 'picture') {
      content = <ImageQuestions />;
    } else if (questions[currentQuestion].question_type === 'qr') {
      content = <QRCodeQuestions />;
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
  } else{
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
    paddingBottom: 7
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
    paddingBottom: 7
  },
  buttonContainer: {
    alignSelf: 'center',
    backgroundColor: Colors.dhbwRed,
    margin: 6,
    borderRadius: 5
  },
  buttonContainerDeactive: {
    alignSelf: 'center',
    backgroundColor: Colors.dhbwGray,
    margin: 6,
    borderRadius: 5
  },
  groupSelectionText: {
    color: Colors.dhbwGray,
    fontSize: 30,
    textAlign: 'center',
  },
});
