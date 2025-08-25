import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, View } from 'react-native';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { store$ } from '@/services/storage/Store';
import { saveAnswer } from '@/services/storage/answerStorage';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { confirmAlert } from '@/utils/ConfirmAlert';
import UIButton from '@/ui/UIButton';
import Hint from '@/ui/Hint';
import { supabase } from '@/utils/Supabase';
import { ThemeContext } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';

export default function ImageQuestion({ question }: QuestionProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const [pictureUri, setPictureUri] = useState<string | null>(null);

  const team = store$.team.get();
  const answers = store$.answers.get() as AnswerRow[];
  const correct = useMemo(
    () =>
      (answers.find((a) => a.question_id === question.id && a.correct)?.text || '')
        .toLowerCase(),
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
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
    >
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
                  : Colors.lightMode.text,
              },
            ]}
          >
            {question.question}
          </Text>
        </View>

        {pictureUri ? (
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
            <Image
              source={{ uri: pictureUri }}
              style={{ height: '100%', borderRadius: 10, paddingVertical: 10 }}
              resizeMode="contain"
            />
          </View>
        ) : null}

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
          <TextInput
            style={[
              globalStyles.skillStyles.input,
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
                borderColor: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
              },
            ]}
            value={answer}
            onChangeText={(text) => setAnswer(text)}
            placeholder={
              language === 'de' ? 'Deine Antwort...' : 'Your answer...'
            }
            placeholderTextColor={
              isDarkMode ? Colors.darkMode.text : Colors.lightMode.text
            }
          />
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
    </ScrollView>
  );
}

