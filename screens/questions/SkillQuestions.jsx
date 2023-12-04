import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSharedStates } from '../../utils/sharedStates';
import { supabase } from '../../utils/supabase';
import Constants from '../../utils/Constants';
import Colors from '../../utils/Colors';

export default function SkillQuestions() {
  const [answer, setAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [confirmedAnswer, setConfirmedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const {
    questions,
    currentQuestion,
    setCurrentQuestion,
    points,
    setPoints,
  } = useSharedStates();

  useEffect(() => {
    const fetchData = async () => {
      const { data: answer } = await supabase
        .from('Wissensfragen')
        .select('Antwort, Punkte')
        .eq('fragen_id', questions[currentQuestion].fragen_id);
      setCorrectAnswer(answer);
    };
    fetchData();
  }, [!answered]);

  const handleNext = () => {
    if (answer.trim() === correctAnswer[0].Antwort) {
      setPoints(points + correctAnswer[0].Punkte);
    }
    setCurrentQuestion(currentQuestion + 1);
    setAnswer('');
    setAnswered(false);
  };

  const handleAnswerSubmit = () => {
    setAnswered(true);
    if (answer.trim() === '') {
      Alert.alert('Fehler', 'Bitte gebe eine Antwort ein.');
      return;
    }

    Alert.alert(
      'Sicherheitsfrage',
      `Bist du sicher, dass "${answer}" deine endgültige Antwort ist?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Ja, Antwort bestätigen',
          onPress: () => handleNext(),
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <Text style={styles.question}>
          {questions[currentQuestion].frage}
        </Text>
        <TextInput
          style={styles.input}
          value={answer}
          onChangeText={setAnswer}
          placeholder="Gib hier deine Antwort ein"
        />
        <View style={!answer?styles.buttonContainerDeactive:styles.buttonContainer}>
        <Button
          style={styles.button}
          color={'white'}
          title="Antwort senden"
          onPress={handleAnswerSubmit}
          disabled={!answer}
        />
        </View>
        
        {confirmedAnswer ? (
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>
              Bestätigte Antwort:
            </Text>
            <Text style={styles.answer}>{confirmedAnswer}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer:{
    flexGrow: 1, 
    justifyContent: 'center'
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  question: {
    fontSize: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: Colors.dhbwGray,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    fontSize: Constants.bigFont
  },
  answerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  answer: {
    fontSize: 16,
  },
  buttonContainer: {
    backgroundColor: Colors.dhbwRed,
    margin:6,
    borderRadius: 5
  },
  buttonContainerDeactive:{
    backgroundColor: Colors.dhbwGray,
    margin:6,
    borderRadius: 5
  }
});
