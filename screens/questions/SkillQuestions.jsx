import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { store$ } from '../../utils/Store';
import UIButton from '../../ui/UIButton';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/GlobalStyles';
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
    <ScrollView contentContainerStyle={globalStyles.skillStyles.contentContainer}>
      <View style={globalStyles.skillStyles.container}>
        <Text style={globalStyles.default.question}>
          {currentQuestion.question}
        </Text>
        <TextInput
          style={globalStyles.skillStyles.input}
          value={answer}
          onChangeText={setAnswer}
          placeholder="Gib hier deine Antwort ein"
        />
        <View
          style={
            !answer
              ? globalStyles.skillStyles.buttonContainerDeactive
              : globalStyles.skillStyles.buttonContainer
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
