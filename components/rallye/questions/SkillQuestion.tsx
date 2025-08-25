import React, { useContext, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { store$ } from '@/services/storage/Store';
import UIButton from '@/components/ui/UIButton';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { confirmAlert } from '@/utils/ConfirmAlert';
import Hint from '@/components/ui/Hint';
import { saveAnswer } from '@/services/storage/answerStorage';
import { ThemeContext } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';

export default function SkillQuestion({ question }: QuestionProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage();
  const [answer, setAnswer] = useState<string>('');

  const team = store$.team.get();
  const answers = store$.answers.get() as AnswerRow[];
  const correct = answers.find(
    (a) => a.question_id === question.id && a.correct
  );
  const correctText = (correct?.text ?? '').toLowerCase();

  const handlePersist = async () => {
    const trimmed = answer.trim();
    const isCorrect = trimmed.toLowerCase() === correctText;
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
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
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
              onChangeText={(text) => setAnswer(text.trim())}
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
              color={answer.trim() ? Colors.dhbwRed : Colors.dhbwGray}
              disabled={!answer.trim()}
              onPress={handleSubmit}
            >
              {language === 'de' ? 'Antwort senden' : 'Submit answer'}
            </UIButton>
          </View>
        </View>
        {question.hint ? <Hint hint={question.hint} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
