import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { useAppStyles } from '@/utils/AppStyles';
import Colors from '@/utils/Colors';
import { confirmAlert } from '@/utils/ConfirmAlert';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { useKeyboard } from '@/utils/useKeyboard';
import { saveAnswer } from '@/services/storage/answerStorage';
import { store$ } from '@/services/storage/Store';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';

export default function SkillQuestion({ question }: QuestionProps) {
  const { language } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const s = useAppStyles();
  const { keyboardHeight, keyboardVisible } = useKeyboard();

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
    <KeyboardAvoidingView>
      <ThemedScrollView
        variant="background"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={false}
        contentInsetAdjustmentBehavior={'never'}
        bounces={Platform.OS === 'ios' ? false : undefined}
        scrollIndicatorInsets={{
          bottom: Platform.OS === 'ios' && keyboardVisible ? keyboardHeight : 0,
        }}
        contentContainerStyle={{ paddingBottom: keyboardHeight }} // scroll to see all content when keyboard is open
      >
        <View
          style={[
            globalStyles.default.container,
            s.screen,
            {
              justifyContent: 'flex-start',
              alignItems: 'stretch',
              flex: 0,
              flexGrow: 0,
            },
          ]}
        >
          <View
            style={[
              globalStyles.rallyeStatesStyles.infoBox,
              s.infoBox,
              { maxHeight: undefined, marginBottom: 16 },
            ]}
          >
            <ThemedText
              style={[
                globalStyles.rallyeStatesStyles.infoTitle,
                s.text,
                { textAlign: 'left' },
              ]}
            >
              {question.question}
            </ThemedText>
          </View>

          <View
            style={[
              globalStyles.rallyeStatesStyles.infoBox,
              s.infoBox,
              { marginBottom: 16 },
            ]}
          >
            <ThemedTextInput
              style={[globalStyles.skillStyles.input]}
              value={answer}
              onChangeText={(text) => setAnswer(text)}
              placeholder={
                language === 'de' ? 'Deine Antwort...' : 'Your answer...'
              }
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <View
            style={[
              globalStyles.rallyeStatesStyles.infoBox,
              s.infoBox,
              { marginBottom: 16 },
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
      </ThemedScrollView>
    </KeyboardAvoidingView>
  );
}
