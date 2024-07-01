import { useState } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSetPoints } from '../../utils/Points';
import { TouchableOpacity } from 'react-native';
import { useSharedStates } from '../../utils/SharedStates';
import Constants from '../../utils/Constants';
import Colors from '../../utils/Colors';
import { confirmAlert } from '../../utils/ConfirmAlert';
import HintComponent from '../../ui/HintComponent';

export default function MultipleChoiceQuestions() {
  const [answer, setAnswer] = useState('');
  const [confirmedAnswer, setConfirmedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const { questions, currentQuestion, setCurrentQuestion, group } =
    useSharedStates();
  const setPoints = useSetPoints();

  const handleNext = async () => {
    correctly_answered =
      answer.trim() === questions[currentQuestion].answer;
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
        <Text style={styles.question}>
          {questions[currentQuestion].question}
        </Text>
        {questions[currentQuestion].multiple_answer.map(
          (option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.squareButton}
              onPress={() => setAnswer(option)}
            >
              <View
                style={[
                  styles.innerSquare,
                  {
                    backgroundColor:
                      answer === option ? Colors.dhbwRed : 'white',
                  },
                ]}
              />
              <Text style={styles.answerText}>{option}</Text>
            </TouchableOpacity>
          )
        )}
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
        <HintComponent questionId={questions[currentQuestion].id} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  squareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginStart: 30,
    marginBottom: 20,
  },
  answerText: {
    fontSize: 20,
  },
  innerSquare: {
    width: 24,
    height: 24,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.dhbwGray,
  },
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
