import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { store$ } from '@/services/storage/Store';
import { saveAnswer } from '@/services/storage/answerStorage';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { confirmAlert } from '@/utils/ConfirmAlert';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import { supabase } from '@/utils/Supabase';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import ThemedTextInput from '@/components/themed/ThemedTextInput';

export default function ImageQuestion({ question }: QuestionProps) {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const [pictureUri, setPictureUri] = useState<string | null>(null);
  const s = useAppStyles();

  const team = store$.team.get();
  const answers = store$.answers.get() as AnswerRow[];
  const correct = useMemo(
    () =>
      (
        answers.find((a) => a.question_id === question.id && a.correct)?.text ||
        ''
      ).toLowerCase(),
    [answers, question.id]
  );

  useEffect(() => {
    (async () => {
      if (!question.bucket_path) return;
      const { data, error } = supabase.storage
        .from('question-media')
        .getPublicUrl(question.bucket_path);
      if (!error) setPictureUri(data.publicUrl);
    })();
  }, [question.bucket_path]);

  const handlePersist = async () => {
    const trimmed = answer.trim();
    const isCorrect = trimmed.toLowerCase() === correct;
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
          ? 'Bitte gebe eine Antwort ein.'
          : 'Please enter an answer.'
      );
      return;
    }
    confirmAlert(answer, handlePersist);
  };

  return (
    <ThemedScrollView
      variant="background"
      contentContainerStyle={[globalStyles.default.refreshContainer]}
    >
      <View style={[globalStyles.default.container, s.screen]}>
        <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
          <ThemedText
            style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
          >
            {question.question}
          </ThemedText>
        </View>

        {pictureUri ? (
          <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
            <Image
              source={{ uri: pictureUri }}
              style={{ height: '100%', borderRadius: 10, paddingVertical: 10 }}
              resizeMode="contain"
            />
          </View>
        ) : null}

        <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
          <ThemedTextInput
            style={[globalStyles.skillStyles.input]}
            value={answer}
            onChangeText={(text) => setAnswer(text)}
            placeholder={
              language === 'de' ? 'Deine Antwort...' : 'Your answer...'
            }
          />
        </View>

        <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
          <UIButton
            color={answer.trim() !== '' ? Colors.dhbwRed : Colors.dhbwGray}
            disabled={answer.trim() === ''}
            onPress={handleSubmit}
          >
            {language === 'de' ? 'Antwort senden' : 'Submit answer'}
          </UIButton>
        </View>

        {question.hint ? <Hint hint={question.hint} /> : null}
      </View>
    </ThemedScrollView>
  );
}
