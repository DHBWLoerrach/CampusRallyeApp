import { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import { store$ } from '@/services/storage/Store';
import { saveAnswer } from '@/services/storage/answerStorage';
import SkillQuestions from '@/screens/questions/SkillQuestions';
import UploadQuestions from '@/screens/questions/UploadQuestions';
import QRCodeQuestions from '@/screens/questions/QRCodeQuestions';
import MultipleChoiceQuestions from '@/screens/questions/MultipleChoiceQuestions';
import ImageQuestions from '@/screens/questions/ImageQuestions';
import { globalStyles } from '@/utils/GlobalStyles';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import TimeHeader from '@/navigation/TimeHeader';

const questionTypeComponents = {
  knowledge: SkillQuestions,
  upload: UploadQuestions,
  qr_code: QRCodeQuestions,
  multiple_choice: MultipleChoiceQuestions,
  picture: ImageQuestions,
};

const QuestionsScreen = observer(function QuestionsScreen() {
  const [loading, setLoading] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const questions = store$.questions.get();
  const currentQuestion = store$.currentQuestion.get();
  const points = store$.points.get();
  const allQuestionsAnswered = store$.allQuestionsAnswered.get();
  const timeExpired = store$.timeExpired.get();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { language } = useLanguage();

  useEffect(() => {
    if (!rallye) {
      router.replace('/');
      return;
    }

    // Check if we should redirect back to rally main screen
    if (allQuestionsAnswered || timeExpired || rallye.status !== 'running') {
      router.replace('/rally');
      return;
    }
  }, [rallye, allQuestionsAnswered, timeExpired]);

  // Handle answer submission
  const handleAnswer = async (answered_correctly: boolean, answerPoints: number) => {
    try {
      if (answered_correctly) {
        store$.points.set(points + answerPoints);
      }
      
      if (team && currentQuestion) {
        await saveAnswer(
          team.id,
          currentQuestion.id,
          answered_correctly,
          answered_correctly ? answerPoints : 0
        );
      }
      
      store$.gotoNextQuestion();
    } catch (error) {
      console.error('Error saving answer:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Antwort konnte nicht gespeichert werden.'
          : 'Answer could not be saved.'
      );
    }
  };

  if (!rallye) {
    return (
      <View
        style={[
          globalStyles.default.container,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.dhbwRed} />
      </View>
    );
  }

  if (!currentQuestion) {
    // No current question, go back to rally main
    router.replace('/rally');
    return null;
  }

  const QuestionComponent = questionTypeComponents[currentQuestion.type];
  
  if (!QuestionComponent) {
    console.error(`Unknown question type: ${currentQuestion.type}`);
    router.replace('/rally');
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      {!rallye.tour_mode && <TimeHeader />}
      <View
        style={[
          { flex: 1 },
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        <QuestionComponent
          question={currentQuestion}
          onAnswer={handleAnswer}
          loading={loading}
        />
      </View>
    </View>
  );
});

export default QuestionsScreen;