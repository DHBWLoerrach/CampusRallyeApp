import React, { useMemo, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { store$ } from '@/services/storage/Store';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import { confirmAlert } from '@/utils/ConfirmAlert';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';
import { saveAnswer } from '@/services/storage/answerStorage';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';

export default function MultipleChoiceQuestion({ question }: QuestionProps) {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const s = useAppStyles();

  const team = store$.team.get();
  const answers = store$.answers.get() as AnswerRow[];

  const options = useMemo(() => {
    const filtered = answers.filter((a) => a.question_id === question.id);
    // shuffle copy to avoid mutating store data
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
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
      <View style={[globalStyles.default.container, s.screen]}>
        <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
          <ThemedText
            style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
          >
            {question.question}
          </ThemedText>
        </View>

        <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
          {options.map((option) => (
            <TouchableOpacity
              key={String(option.id)}
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
          ))}
        </View>

        <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
          <UIButton
            color={answer ? Colors.dhbwRed : Colors.dhbwGray}
            disabled={!answer}
            onPress={handleSubmit}
          >
            {language === 'de' ? 'Antwort senden' : 'Submit answer'}
          </UIButton>
        </View>
      </View>
      {question.hint ? <Hint hint={question.hint} /> : null}
    </ThemedScrollView>
  );
}
