import { useMemo, useRef, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeInDown,
  LinearTransition,
} from 'react-native-reanimated';
import { observer, useSelector } from '@legendapp/state/react';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { useAppStyles } from '@/utils/AppStyles';
import Colors from '@/utils/Colors';
import { confirmAnswer } from '@/utils/ConfirmAlert';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import { submitAnswerAndAdvance } from '@/services/storage/answerSubmission';
import { store$ } from '@/services/storage/Store';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';

function MultipleChoiceQuestion({ question }: QuestionProps) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
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
    if (submitting) return;
    setSubmitting(true);
    const trimmed = answer.trim();
    const isCorrect = trimmed.toLowerCase() === correctAnswer;
    try {
      await submitAnswerAndAdvance({
        teamId: team?.id ?? null,
        questionId: question.id,
        answeredCorrectly: isCorrect,
        pointsAwarded: isCorrect ? question.points : 0,
        answerText: trimmed,
      });
      setAnswer('');
    } catch (e) {
      console.error('Error submitting answer:', e);
      Alert.alert(t('common.errorTitle'), t('question.error.saveAnswer'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = answer.trim();
    if (!trimmed) {
      Alert.alert(t('common.errorTitle'), t('question.error.selectAnswer'));
      return;
    }
    const confirmed = await confirmAnswer({ answer: trimmed, t });
    if (!confirmed) return;
    await handlePersist();
  };

  return (
    <ThemedScrollView
      variant="background"
      contentContainerStyle={globalStyles.default.refreshContainer}
    >
      <VStack
        style={[globalStyles.default.container, { alignItems: 'stretch' }]}
        gap={2}
      >
        <InfoBox mb={0}>
          <ThemedText
            variant="title"
            style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
          >
            {question.question}
          </ThemedText>
        </InfoBox>

        <InfoBox mb={0}>
          {options.length === 0 ? (
            <ThemedText style={globalStyles.multipleChoiceStyles.answerText}>
              {t('question.options.loading')}
            </ThemedText>
          ) : (
            options.map((option, idx) => {
              const optionText = option.text ?? '';
              const isSelected = answer === optionText;
              return (
                <Animated.View
                  key={String(option.id)}
                  entering={FadeInDown.duration(220).delay(idx * 70)}
                  layout={LinearTransition.springify()}
                >
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={optionText}
                    accessibilityHint={t('a11y.answerOptionHint')}
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      globalStyles.multipleChoiceStyles.squareButton,
                      {
                        borderColor: isSelected
                          ? Colors.dhbwRed
                          : isDarkMode
                          ? Colors.darkMode.text
                          : Colors.dhbwGray,
                      },
                    ]}
                    onPress={() => setAnswer(optionText)}
                  >
                    <View
                      style={[
                        globalStyles.multipleChoiceStyles.innerSquare,
                        {
                          backgroundColor: isSelected
                            ? Colors.dhbwRed
                            : isDarkMode
                            ? Colors.darkMode.card
                            : Colors.lightMode.card,
                        },
                      ]}
                    />
                    <ThemedText
                      style={globalStyles.multipleChoiceStyles.answerText}
                    >
                      {optionText}
                    </ThemedText>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </InfoBox>

        <InfoBox mb={0}>
          <UIButton
            color={answer ? Colors.dhbwRed : Colors.dhbwGray}
            disabled={!answer || submitting}
            loading={submitting}
            onPress={handleSubmit}
          >
            {t('question.submit')}
          </UIButton>
        </InfoBox>
      </VStack>
      {question.hint ? <Hint hint={question.hint} /> : null}
    </ThemedScrollView>
  );
}

export default observer(MultipleChoiceQuestion);
