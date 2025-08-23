import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import { store$ } from '@/services/storage/Store';
import UIButton from '@/ui/UIButton';
import { globalStyles } from '@/utils/GlobalStyles';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { FontAwesome } from '@expo/vector-icons';

const ExploreResultsScreen = observer(function ExploreResultsScreen() {
  const rallye = store$.rallye.get();
  const points = store$.points.get();
  const questions = store$.questions.get();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { language } = useLanguage();

  useEffect(() => {
    if (!rallye) {
      router.replace('/');
    }
  }, [rallye]);

  const goBackToWelcome = () => {
    // Reset store and go back to welcome
    store$.reset();
    store$.rallye.set(null);
    router.replace('/');
  };

  if (!rallye) {
    return null;
  }

  const totalQuestions = questions?.length || 0;
  const maxPoints = questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;

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
        {language === 'de' ? 'Exploration beendet!' : 'Exploration completed!'}
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
          {language === 'de' ? 'Dein Ergebnis' : 'Your result'}
        </Text>
        <Text
          style={[
            globalStyles.rallyeStatesStyles.infoSubtitle,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
              fontSize: 18,
              fontWeight: 'bold',
              marginTop: 10,
            },
          ]}
        >
          {language === 'de' 
            ? `${points} von ${maxPoints} Punkten`
            : `${points} of ${maxPoints} points`}
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
            ? `${totalQuestions} Fragen beantwortet`
            : `${totalQuestions} questions answered`}
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
          {rallye.name}
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
            ? 'Danke fürs Erkunden des Campus!'
            : 'Thanks for exploring the campus!'}
        </Text>
      </View>

      <UIButton icon="home" onPress={goBackToWelcome}>
        {language === 'de' ? 'Zurück zum Start' : 'Back to start'}
      </UIButton>
    </ScrollView>
  );
});

export default ExploreResultsScreen;