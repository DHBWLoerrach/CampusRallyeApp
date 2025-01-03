import { useState } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { store$ } from '../../utils/Store';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/GlobalStyles';
import { confirmAlert } from '../../utils/ConfirmAlert';
import Hint from '../../ui/Hint';

export default function MultipleChoiceQuestions() {
  const [answer, setAnswer] = useState('');
  const currentQuestion = store$.currentQuestion.get();

  const handleNext = async () => {
    correctly_answered = answer.trim() === currentQuestion.answer;
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
    <ScrollView contentContainerStyle={globalStyles.multipleChoiceStyles.contentContainer}>
      <View style={globalStyles.multipleChoiceStyles.container}>
        <Text style={globalStyles.default.question}>
          {currentQuestion.question}
        </Text>
        <View>
          {currentQuestion.multiple_answer.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={globalStyles.multipleChoiceStyles.squareButton}
              onPress={() => setAnswer(option)}
            >
              <View
                style={[
                  globalStyles.multipleChoiceStyles.innerSquare,
                  {
                    backgroundColor:
                      answer === option ? Colors.dhbwRed : 'white',
                  },
                ]}
              />
              <Text style={globalStyles.multipleChoiceStyles.answerText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View
          style={
            !answer
              ? globalStyles.multipleChoiceStyles.buttonContainerDeactive
              : globalStyles.multipleChoiceStyles.buttonContainer
          }
        >
          <Button //Red Button
            style={globalStyles.multipleChoiceStyles.button}
            color={Platform.OS === 'ios' ? 'white' : Colors.dhbwRed}
            title="Antwort senden"
            onPress={handleAnswerSubmit}
            disabled={!answer}
          />
        </View>
        {currentQuestion.hint && <Hint hint={currentQuestion.hint} />}
      </View>
    </ScrollView>
  );
}