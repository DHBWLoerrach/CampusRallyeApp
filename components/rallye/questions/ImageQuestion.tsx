import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { useAppStyles } from '@/utils/AppStyles';
import Colors from '@/utils/Colors';
import { confirmAlert } from '@/utils/ConfirmAlert';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { supabase } from '@/utils/Supabase';
import { useKeyboard } from '@/utils/useKeyboard';
import { saveAnswer } from '@/services/storage/answerStorage';
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
  const [pictureUri, setPictureUri] = useState<string | null>(null);
  const s = useAppStyles();
  const { keyboardHeight, keyboardVisible } = useKeyboard();

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
      const result = supabase.storage
        .from('question-media')
        .getPublicUrl(question.bucket_path);
      if (!('error' in result) || !result.error) {
        setPictureUri(result.data.publicUrl);
      }
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
          <InfoBox mb={2}>
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

          {pictureUri ? (
            <InfoBox mb={2}>
              <Image
                source={{ uri: pictureUri }}
                style={{ width: '100%', height: 250, borderRadius: 10 }}
                resizeMode="contain"
              />
            </InfoBox>
          ) : null}

          <InfoBox mb={2}>
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

          <InfoBox mb={2}>
            <UIButton
              color={answer.trim() !== '' ? Colors.dhbwRed : Colors.dhbwGray}
              disabled={answer.trim() === ''}
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
