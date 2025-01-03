import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Button,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { store$ } from '../../utils/Store';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/GlobalStyles';
import { confirmAlert } from '../../utils/ConfirmAlert';
import Hint from '../../ui/Hint';

export default function ImageQuestions() {
  const [answer, setAnswer] = useState('');
  const currentQuestion = store$.currentQuestion.get();

  const handleNext = async () => {
    const correctly_answered =
      answer.trim() === currentQuestion.answer;
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
    <ScrollView contentContainerStyle={globalStyles.imageStyles.contentContainer}>
      <View style={globalStyles.imageStyles.container}>
        <Text style={globalStyles.default.question}>
          {currentQuestion.question}
        </Text>
        <Image
          source={{ uri: currentQuestion.uri }}
          style={globalStyles.imageStyles.picture}
        />
        <TextInput
          style={globalStyles.imageStyles.input}
          value={answer}
          onChangeText={setAnswer}
          placeholder="Gib hier deine Antwort ein"
        />
        <View
          style={
            !answer
              ? globalStyles.imageStyles.buttonContainerDeactive
              : globalStyles.imageStyles.buttonContainer
          }
        >
          <Button //Red Button
            style={globalStyles.imageStyles.button}
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
