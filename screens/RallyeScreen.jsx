import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { supabase } from '../utils/supabase';
import SkillQuestions from './questions/SkillQuestions';
import ImageQuestions from './questions/ImageQuestions';
import QRCodeQuestions from './questions/QRCodeQuestions';
import { useSharedStates } from '../utils/sharedStates';
import Colors from '../utils/Colors';

export default function RallyeScreen() {
  // import shared states
  const { questions, setQuestions } = useSharedStates();
  const { currentQuestion } = useSharedStates();
  const { points } = useSharedStates();
  const [loading, setLoading] = useState(true);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: questions } = await supabase
        .from('Fragen')
        .select();

      // get random question as start point
      let startQuestion =
        questions[Math.floor(Math.random() * questions.length)];
      let index = questions.indexOf(startQuestion);

      // rotate array until startQuestion is first element in array
      for (let i = 0; i < index; i++) {
        let question = questions[0];
        questions.shift(questions.push(question));
      }
      setQuestions(questions);
      setLoading(false);
    };
    fetchData();
  }, []);

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
    if (questions[currentQuestion].typ === 'Wissensfragen') {
      content = <SkillQuestions />;
    } else if (questions[currentQuestion].typ === 'Bild') {
      content = <ImageQuestions />;
    } else if (questions[currentQuestion].typ === 'QRFragen') {
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
        <Text style={styles.tileText}>
          Ladet gerne euren Gruppennamen und eure Punktzahl hoch, um
          im Ranking aufgenommen zu werden! Einfach auf 'Hochladen'
          klicken.
        </Text>
        <View>
          <View style={uploaded?styles.buttonContainerDeactive:styles.buttonContainer}>
          <Button
            title="Hochladen"
            onPress={() => savePoints()}
            color="white"
            disabled={uploaded}
          />
          </View>
          
        </View>
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
    paddingBottom:7
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
    paddingBottom:7
  },
  buttonContainer: {
    alignSelf:'center',
    backgroundColor: Colors.dhbwRed,
    margin:6,
    borderRadius: 5
  },
  buttonContainerDeactive:{
    alignSelf:'center',
    backgroundColor: Colors.dhbwGray,
    margin:6,
    borderRadius: 5
  }
});
