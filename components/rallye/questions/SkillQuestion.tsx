import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { useAppStyles } from '@/utils/AppStyles';
import Colors from '@/utils/Colors';
import { confirmAlert } from '@/utils/ConfirmAlert';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { useKeyboard } from '@/utils/useKeyboard';
import { submitAnswerAndAdvance } from '@/services/storage/answerSubmission';
import { store$ } from '@/services/storage/Store';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';

export default function SkillQuestion({ question }: QuestionProps) {
  const { language } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const s = useAppStyles();
  const { keyboardHeight, keyboardVisible } = useKeyboard();

  const team = store$.team.get();
  const answers = useSelector(() => store$.answers.get() as AnswerRow[]);
  const correct = answers.find(
    (a) => a.question_id === question.id && a.correct
  );
  const correctText = (correct?.text ?? '').toLowerCase().trim();
  const answerKeyReady = correctText.length > 0;

  const handlePersist = async () => {
    if (submitting) return;
    setSubmitting(true);
    const trimmed = answer.trim();
    const isCorrect = trimmed.toLowerCase() === correctText;
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
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Antwort konnte nicht gespeichert werden.'
          : 'Answer could not be saved.'
      );
    } finally {
      setSubmitting(false);
    }
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
    if (!answerKeyReady) {
      Alert.alert(
        language === 'de' ? 'Bitte warten' : 'Please wait',
        language === 'de'
          ? 'Die Antwortdaten werden noch geladen.'
          : 'Answer data is still loading.'
      );
      return;
    }
    confirmAlert(answer, handlePersist);
  };

  return (
    <KeyboardAvoidingView>
      <ThemedScrollView
        variant="background"
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={false}
        contentInsetAdjustmentBehavior={'never'}
        bounces={Platform.OS === 'ios' ? false : undefined}
        scrollIndicatorInsets={{
          bottom: Platform.OS === 'ios' && keyboardVisible ? keyboardHeight : 0,
        }}
        contentContainerStyle={{ paddingBottom: keyboardHeight }} // allow scrolling above keyboard
      >
        <VStack
          style={[
            globalStyles.default.container,
            { alignItems: 'stretch', flex: 0, flexGrow: 0 },
          ]}
          gap={2}
        >
          <InfoBox mb={0}>
            <ThemedText
              style={[
                globalStyles.rallyeStatesStyles.infoTitle,
                s.text,
                { textAlign: 'left' },
              ]}
            >
              {question.question}
            </ThemedText>
          </InfoBox>

          <InfoBox mb={0}>
            <ThemedTextInput
              style={[globalStyles.skillStyles.input]}
              value={answer}
              onChangeText={(text) => setAnswer(text)}
              placeholder={
                language === 'de' ? 'Deine Antwort...' : 'Your answer...'
              }
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={handleSubmit}
            />
          </InfoBox>

          <InfoBox mb={0}>
            <UIButton
              color={answer.trim() && answerKeyReady ? Colors.dhbwRed : Colors.dhbwGray}
              disabled={!answer.trim() || !answerKeyReady || submitting}
              loading={submitting}
              onPress={handleSubmit}
            >
              {language === 'de' ? 'Antwort senden' : 'Submit answer'}
            </UIButton>
          </InfoBox>
        </VStack>
        {question.hint ? <Hint hint={question.hint} /> : null}
      </ThemedScrollView>
    </KeyboardAvoidingView>
  );
}
