import { useMemo, useRef, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { observer, useSelector } from '@legendapp/state/react';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { useAppStyles } from '@/utils/AppStyles';
import Colors from '@/utils/Colors';
import { confirmAlert } from '@/utils/ConfirmAlert';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import { saveAnswer } from '@/services/storage/answerStorage';
import { store$ } from '@/services/storage/Store';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';

function MultipleChoiceQuestion({ question }: QuestionProps) {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const s = useAppStyles();

  const team = store$.team.get();
  // Use selector so that the component re-renders once answers are fetched asynchronously
  const answers = useSelector(() => store$.answers.get() as AnswerRow[]);

  const shuffleCache = useRef<{ key: string; data: AnswerRow[] } | null>(null);
  const options = useMemo(() => {
    const filtered = answers.filter((a) => a.question_id === question.id);
    const key = `${question.id}:${filtered.map((f) => f.id).join(',')}`;
    if (shuffleCache.current && shuffleCache.current.key === key) {
      return shuffleCache.current.data;
    }
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    shuffleCache.current = { key, data: shuffled };
    return shuffled;
  }, [answers, question.id]);

  const correctAnswer = useMemo(
    () =>
      options
        .find((o) => o.correct)
        ?.text?.toLowerCase()
        .trim() ?? '',
    [options]
  );

  const handlePersist = async () => {
    const trimmed = answer.trim();
    const isCorrect = trimmed.toLowerCase() === correctAnswer;
    if (isCorrect) store$.points.set(store$.points.get() + question.points);
    if (team) {
      await saveAnswer(
        team.id,
        question.id,
        isCorrect,
        isCorrect ? question.points : 0,
        trimmed
      );
    }
    store$.gotoNextQuestion();
    setAnswer('');
  };

  const handleSubmit = () => {
    if (!answer.trim()) {
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Bitte wähle eine Antwort aus.'
          : 'Please select an answer.'
      );
      return;
    }
    confirmAlert(answer, handlePersist);
  };

  return (
    <ThemedScrollView
      variant="background"
      contentContainerStyle={globalStyles.default.refreshContainer}
    >
      <VStack style={[globalStyles.default.container, { alignItems: 'stretch' }]} gap={2}>
        <InfoBox mb={0}>
          <ThemedText style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}>
            {question.question}
          </ThemedText>
        </InfoBox>

        <InfoBox mb={0}>
          {options.length === 0 ? (
            <ThemedText style={globalStyles.multipleChoiceStyles.answerText}>
              {language === 'de'
                ? 'Antwortoptionen werden geladen…'
                : 'Loading answer options…'}
            </ThemedText>
          ) : (
            options.map((option, idx) => (
              <Animated.View
                key={String(option.id)}
                entering={FadeInDown.duration(220).delay(idx * 70)}
                layout={LinearTransition.springify()}
              >
                <TouchableOpacity
                  style={[
                    globalStyles.multipleChoiceStyles.squareButton,
                    {
                      borderColor:
                        answer === (option.text ?? '')
                          ? Colors.dhbwRed
                          : isDarkMode
                          ? Colors.darkMode.text
                          : Colors.dhbwGray,
                    },
                  ]}
                  onPress={() => setAnswer(option.text ?? '')}
                >
                  <View
                    style={[
                      globalStyles.multipleChoiceStyles.innerSquare,
                      {
                        backgroundColor:
                          answer === (option.text ?? '')
                            ? Colors.dhbwRed
                            : isDarkMode
                            ? Colors.darkMode.card
                            : Colors.lightMode.card,
                      },
                    ]}
                  />
                  <ThemedText style={globalStyles.multipleChoiceStyles.answerText}>
                    {option.text}
                  </ThemedText>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </InfoBox>

        <InfoBox mb={0}>
          <UIButton
            color={answer ? Colors.dhbwRed : Colors.dhbwGray}
            disabled={!answer}
            onPress={handleSubmit}
          >
            {language === 'de' ? 'Antwort senden' : 'Submit answer'}
          </UIButton>
        </InfoBox>
        {question.hint ? <Hint hint={question.hint} /> : null}
      </VStack>
    </ThemedScrollView>
  );
}

export default observer(MultipleChoiceQuestion);
