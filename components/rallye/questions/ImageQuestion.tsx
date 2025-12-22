import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { useAppStyles } from '@/utils/AppStyles';
import Colors from '@/utils/Colors';
import { confirmAlert } from '@/utils/ConfirmAlert';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { supabase } from '@/utils/Supabase';
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

export default function ImageQuestion({ question }: QuestionProps) {
  const { language } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [pictureUri, setPictureUri] = useState<string | null>(null);
  const s = useAppStyles();
  const { keyboardHeight, keyboardVisible } = useKeyboard();

  const team = store$.team.get();
  const answers = useSelector(() => store$.answers.get() as AnswerRow[]);
  const correct = useMemo(
    () =>
      (
        answers.find((a) => a.question_id === question.id && a.correct)?.text ||
        ''
      ).toLowerCase().trim(),
    [answers, question.id]
  );
  const answerKeyReady = correct.length > 0;

  useEffect(() => {
    (async () => {
      if (!question.bucket_path) return;
      const result = supabase.storage
        .from('question-media')
        .getPublicUrl(question.bucket_path);
      if (!('error' in result) || !result.error) {
        setPictureUri(result.data.publicUrl);
      }
    })();
  }, [question.bucket_path]);

  const handlePersist = async () => {
    if (submitting) return;
    setSubmitting(true);
    const trimmed = answer.trim();
    const isCorrect = trimmed.toLowerCase() === correct;
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
        <VStack
          style={[
            globalStyles.default.container,
            { alignItems: 'stretch', flex: 0, flexGrow: 0 },
          ]}
          gap={2}
        >
          <InfoBox mb={0}>
            <ThemedText
              variant="title"
              style={[
                globalStyles.rallyeStatesStyles.infoTitle,
                s.text,
                { textAlign: 'left' },
              ]}
            >
              {question.question}
            </ThemedText>
          </InfoBox>

          {pictureUri ? (
            <InfoBox mb={0}>
              <Image
                source={{ uri: pictureUri }}
                style={{ width: '100%', height: 250, borderRadius: 10 }}
                resizeMode="contain"
              />
            </InfoBox>
          ) : null}

          <InfoBox mb={0}>
            <ThemedTextInput
              style={[globalStyles.skillStyles.input]}
              value={answer}
              onChangeText={(text: string) => setAnswer(text)}
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
              color={answer.trim() !== '' && answerKeyReady ? Colors.dhbwRed : Colors.dhbwGray}
              disabled={answer.trim() === '' || !answerKeyReady || submitting}
              loading={submitting}
              onPress={handleSubmit}
            >
              {language === 'de' ? 'Antwort senden' : 'Submit answer'}
            </UIButton>
          </InfoBox>

          {question.hint ? <Hint hint={question.hint} /> : null}
        </VStack>
      </ThemedScrollView>
    </KeyboardAvoidingView>
  );
}
