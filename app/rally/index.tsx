import { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Text,
  useColorScheme,
} from 'react-native';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { store$ } from '@/services/storage/Store';
import { supabase } from '@/utils/Supabase';
import { globalStyles } from '@/utils/GlobalStyles';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import UIButton from '@/ui/UIButton';
import { FontAwesome } from '@expo/vector-icons';
import VotingScreen from '@/screens/VotingScreen';
import Scoreboard from '@/screens/ScoreboardScreen';

const RallyScreen = observer(function RallyScreen() {
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

  const loadQuestions = async () => {
    setLoading(true);
    try {
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

        // Randomize question order
        const shuffledQuestions = questionsData?.sort(() => Math.random() - 0.5) || [];
        store$.questions.set(shuffledQuestions);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnswers = async () => {
    if (!team || !rallye) return;
    
    try {
      const { data, error } = await supabase
        .from('team_questions')
        .select('*')
        .eq('team_id', team.id)
        .eq('rallye_id', rallye.id);

      if (error) throw error;
      store$.answers.set(data || []);
    } catch (error) {
      console.error('Error loading answers:', error);
    }
  };

  const getRallyeStatus = async () => {
    if (!rallye) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rallye')
        .select('status')
        .eq('id', rallye.id)
        .single();

      if (error) throw error;
      
      // Update rally status in store
      store$.rallye.set({ ...rallye, status: data.status });
    } catch (error) {
      console.error('Error fetching rallye status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rallye) {
      router.replace('/');
      return;
    }

    if (!team && !rallye.tour_mode) {
      router.replace('/rally/team');
      return;
    }

    if (rallye && (team || rallye.tour_mode)) {
      loadQuestions();
    }
    if (questions) loadAnswers();
  }, [rallye, team]);

  const onRefresh = async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Keine Internetverbindung verfügbar'
          : 'No internet connection available'
      );
      return;
    }

    if (rallye?.status === 'running') {
      await loadQuestions();
      await loadAnswers();
      await getRallyeStatus();
      if (!team && !rallye.tour_mode) {
        router.replace('/rally/team');
      }
    } else {
      await getRallyeStatus();
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
        <Text
          style={[
            globalStyles.default.bigText,
            {
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            },
          ]}
        >
          {language === 'de' ? 'Keine Rallye ausgewählt' : 'No rally selected'}
        </Text>
        <UIButton onPress={() => router.replace('/')}>
          {language === 'de' ? 'Zurück' : 'Back'}
        </UIButton>
      </View>
    );
  }

  // Rally state handling
  switch (rallye.status) {
    case 'preparation':
      return <PreparationState loading={loading} onRefresh={onRefresh} />;
    
    case 'running':
      if (questions?.length === 0) {
        return <NoQuestionsState loading={loading} onRefresh={onRefresh} />;
      }
      if (allQuestionsAnswered || timeExpired) {
        return <AllQuestionsAnsweredState points={points} />;
      }
      // Navigate to questions
      router.push('/rally/questions');
      return null;
    
    case 'post_processing':
      return <PostProcessingState loading={loading} onRefresh={onRefresh} />;
    
    case 'ended':
      return <EndedState />;
    
    default:
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
          <Text
            style={[
              globalStyles.default.bigText,
              {
                color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
              },
            ]}
          >
            {language === 'de' ? 'Unbekannter Status' : 'Unknown status'}
          </Text>
          <UIButton onPress={() => router.replace('/')}>
            {language === 'de' ? 'Zurück' : 'Back'}
          </UIButton>
        </View>
      );
  }
});

// State Components
const PreparationState = ({ loading, onRefresh }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { language } = useLanguage();

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <FontAwesome
        name="clock-o"
        size={80}
        color={Colors.dhbwRed}
        style={globalStyles.rallyeStatesStyles.successIcon}
      />
      
      <Text style={globalStyles.rallyeStatesStyles.title}>
        {language === 'de' ? 'Bald geht es los!' : 'Starting soon!'}
      </Text>

      <View
        style={[
          globalStyles.rallyeStatesStyles.infoBox,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.card,
          },
        ]}
      >
        <Text
          style={[
            globalStyles.rallyeStatesStyles.infoTitle,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {language === 'de'
            ? 'Die Rallye hat noch nicht begonnen'
            : 'The rally has not started yet'}
        </Text>
        <Text
          style={[
            globalStyles.rallyeStatesStyles.infoSubtitle,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {language === 'de'
            ? 'Bitte warte auf den Start der Rallye'
            : 'Please wait for the rally to start'}
        </Text>
      </View>
      
      <View
        style={[
          globalStyles.rallyeStatesStyles.infoBox,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.card,
          },
        ]}
      >
        <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
          {language === 'de' ? 'Aktualisieren' : 'Refresh'}
        </UIButton>
      </View>
    </ScrollView>
  );
};

const NoQuestionsState = ({ loading, onRefresh }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { language } = useLanguage();

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <FontAwesome
        name="question-circle"
        size={80}
        color={Colors.dhbwRed}
        style={globalStyles.rallyeStatesStyles.successIcon}
      />

      <View
        style={[
          globalStyles.rallyeStatesStyles.infoBox,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.card,
          },
        ]}
      >
        <Text
          style={[
            globalStyles.rallyeStatesStyles.infoTitle,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {language === 'de' ? 'Keine Fragen' : 'No questions'}
        </Text>
        <Text
          style={[
            globalStyles.rallyeStatesStyles.infoSubtitle,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {language === 'de'
            ? 'Momentan sind keine Fragen verfügbar.'
            : 'Currently no questions available.'}
        </Text>
      </View>

      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        {language === 'de' ? 'Aktualisieren' : 'Refresh'}
      </UIButton>
    </ScrollView>
  );
};

const AllQuestionsAnsweredState = ({ points }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { language } = useLanguage();

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
    >
      <FontAwesome
        name="trophy"
        size={80}
        color={Colors.dhbwRed}
        style={globalStyles.rallyeStatesStyles.successIcon}
      />

      <Text style={globalStyles.rallyeStatesStyles.title}>
        {language === 'de' ? 'Glückwunsch!' : 'Congratulations!'}
      </Text>

      <View
        style={[
          globalStyles.rallyeStatesStyles.infoBox,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.card,
          },
        ]}
      >
        <Text
          style={[
            globalStyles.rallyeStatesStyles.infoTitle,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {language === 'de'
            ? 'Alle Fragen beantwortet'
            : 'All questions answered'}
        </Text>
        <Text
          style={[
            globalStyles.rallyeStatesStyles.infoSubtitle,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {language === 'de' ? `Du hast ${points} Punkte erreicht!` : `You scored ${points} points!`}
        </Text>
      </View>
    </ScrollView>
  );
};

const PostProcessingState = ({ loading, onRefresh }) => (
  <VotingScreen onRefresh={onRefresh} loading={loading} />
);

const EndedState = () => <Scoreboard />;

export default RallyScreen;