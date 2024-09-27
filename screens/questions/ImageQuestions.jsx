import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Button,
  Platform,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { store$ } from '../../utils/Store';
import Constants from '../../utils/Constants';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/Styles';
import { useSetPoints } from '../../utils/Points';
import { confirmAlert } from '../../utils/ConfirmAlert';
import Hint from '../../ui/Hint';

export default function ImageQuestions() {
  const [answer, setAnswer] = useState('');
  const [confirmedAnswer, setConfirmedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const questions = store$.questions.get();
  const currentQuestion = store$.currentQuestion.get();
  const setPoints = useSetPoints();

  const handleNext = async () => {
    const correctly_answered =
      answer.trim() === currentQuestion.answer;
    await setPoints(correctly_answered, currentQuestion.points);
    store$.gotoNextQuestion();
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
          {currentQuestion.question}
        </Text>
        <Image
          source={{ uri: currentQuestion.uri }}
          style={styles.picture}
        />
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
          <Button //Red Button
            style={styles.button}
            color={Platform.OS === 'ios' ? 'white' : Colors.dhbwRed}
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
        {currentQuestion.hint && <Hint hint={currentQuestion.hint} />}
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
  picture: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
});
