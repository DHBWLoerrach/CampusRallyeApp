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
import SkillQuestions from '@/screens/questions/SkillQuestions';
import UploadQuestions from '@/screens/questions/UploadQuestions';
import QRCodeQuestions from '@/screens/questions/QRCodeQuestions';
import MultipleChoiceQuestions from '@/screens/questions/MultipleChoiceQuestions';
import ImageQuestions from '@/screens/questions/ImageQuestions';
import { globalStyles } from '@/utils/GlobalStyles';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';

const questionTypeComponents = {
  knowledge: SkillQuestions,
  upload: UploadQuestions,
  qr_code: QRCodeQuestions,
  multiple_choice: MultipleChoiceQuestions,
  picture: ImageQuestions,
};

const ExploreQuestionsScreen = observer(function ExploreQuestionsScreen() {
  const [loading, setLoading] = useState(false);
  const rallye = store$.rallye.get();
  const questions = store$.questions.get();
  const currentQuestion = store$.currentQuestion.get();
  const points = store$.points.get();
  const allQuestionsAnswered = store$.allQuestionsAnswered.get();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { language } = useLanguage();

  useEffect(() => {
    if (!rallye) {
      router.replace('/');
      return;
    }

    // Load questions for exploration
    loadQuestions();
  }, [rallye]);

  useEffect(() => {
    // If all questions are answered, go to results
    if (allQuestionsAnswered && questions?.length > 0) {
      router.push('/explore/results');
    }
  }, [allQuestionsAnswered, questions]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('@/utils/Supabase');
      
      // Get all question IDs for the current rally
      const { data: joinData, error: joinError } = await supabase
        .from('join_rallye_questions')
        .select('question_id')
        .eq('rallye_id', rallye?.id);

      if (joinError) throw joinError;

      if (joinData && joinData.length > 0) {
        const questionIds = joinData.map((item) => item.question_id);

        // Get all questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds);

        if (questionsError) throw questionsError;

        // Randomize question order for exploration
        const shuffledQuestions = questionsData?.sort(() => Math.random() - 0.5) || [];
        store$.questions.set(shuffledQuestions);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Fragen konnten nicht geladen werden.'
          : 'Could not load questions.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle answer submission for exploration mode
  const handleAnswer = async (answered_correctly: boolean, answerPoints: number) => {
    try {
      if (answered_correctly) {
        store$.points.set(points + answerPoints);
      }
      
      // In exploration mode, we don't save answers to database
      // Just move to next question
      store$.gotoNextQuestion();
    } catch (error) {
      console.error('Error handling answer:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Ein Fehler ist aufgetreten.'
          : 'An error occurred.'
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

  if (loading) {
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
    // No more questions, go to results
    router.push('/explore/results');
    return null;
  }

  const QuestionComponent = questionTypeComponents[currentQuestion.type];
  
  if (!QuestionComponent) {
    console.error(`Unknown question type: ${currentQuestion.type}`);
    router.push('/explore/results');
    return null;
  }

  return (
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
  );
});

export default ExploreQuestionsScreen;