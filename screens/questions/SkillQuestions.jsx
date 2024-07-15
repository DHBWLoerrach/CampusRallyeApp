import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSharedStates } from '../../utils/SharedStates';
import UIButton from '../../ui/UIButton';
import Constants from '../../utils/Constants';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/Styles';
import { useSetPoints } from '../../utils/Points';
import { confirmAlert } from '../../utils/ConfirmAlert';
import Hint from '../../ui/Hint';

export default function SkillQuestions() {
  const [answer, setAnswer] = useState('');
  const [confirmedAnswer, setConfirmedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const { questions, currentQuestion, setCurrentQuestion } =
    useSharedStates();
  const setPoints = useSetPoints();

  const handleNext = async () => {
    correctly_answered =
      answer.trim().toLowerCase() ===
      questions[currentQuestion].answer.toLowerCase();
    await setPoints(
      correctly_answered,
      questions[currentQuestion].points
    );
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

    confirmAlert(answer, handleNext);
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <Text style={globalStyles.question}>
          {questions[currentQuestion].question}
        </Text>
        <TextInput
          style={styles.input}
          value={answer}
          onChangeText={setAnswer}
          placeholder="Gib hier deine Antwort ein"
        />
        <View
          style={
            !answer
              ? styles.buttonContainerDeactive
              : styles.buttonContainer
          }
        >
          <UIButton
            color={answer ? Colors.dhbwRed : Colors.dhbwGray}
            title="Antwort senden"
            onPress={handleAnswerSubmit}
            disabled={!answer}
          >
            Antwort senden
          </UIButton>
        </View>

        {confirmedAnswer ? (
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>
              Bestätigte Antwort:
            </Text>
            <Text style={styles.answer}>{confirmedAnswer}</Text>
          </View>
        ) : null}
        {questions[currentQuestion].hint && (
          <Hint hint={questions[currentQuestion].hint} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 200, // quickfix for keyboard covering input on small screens
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
    fontSize: Constants.bigFont,
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
    margin: 6,
    borderRadius: 5,
  },
  buttonContainerDeactive: {
    backgroundColor: Colors.dhbwGray,
    margin: 6,
    borderRadius: 5,
  },
});
