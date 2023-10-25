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
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.question}>
          {questions[currentQuestion].frage}
        </Text>
        <Text style={styles.inputLabel}>Antwort:</Text>
        <TextInput
          style={styles.input}
          value={answer}
          onChangeText={setAnswer}
          placeholder="Gib hier deine Antwort ein"
        />
        <Button
          title="Antwort senden"
          onPress={handleAnswerSubmit}
          disabled={!answer}
        />

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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  question: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
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
});
