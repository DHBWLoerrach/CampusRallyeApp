import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { store$ } from '../../utils/Store';
import UIButton from '../../ui/UIButton';
import Constants from '../../utils/Constants';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/Styles';
import { confirmAlert } from '../../utils/ConfirmAlert';
import Hint from '../../ui/Hint';

export default function SkillQuestions() {
  const [answer, setAnswer] = useState('');
  const currentQuestion = store$.currentQuestion.get();

  const handleNext = async () => {
    correctly_answered =
      answer.trim().toLowerCase() ===
      currentQuestion.answer.toLowerCase();
    await store$.savePoints(
      correctly_answered,
      currentQuestion.points
    );
    store$.gotoNextQuestion();
    setAnswer('');
  };

  const handleAnswerSubmit = () => {
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
