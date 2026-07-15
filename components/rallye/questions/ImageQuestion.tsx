import { useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { useAppStyles } from '@/utils/AppStyles';
import Colors from '@/utils/Colors';
import { confirmAnswer } from '@/utils/ConfirmAlert';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { getAnswerKeyForQuestion } from '@/utils/answerRows';
import { useKeyboard } from '@/utils/useKeyboard';
import { store$ } from '@/services/storage/Store';
import { getQuestionPictureUrl } from '@/services/storage/questionStorage';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import { useAnswerSubmission } from './useAnswerSubmission';

export default function ImageQuestion({ question }: QuestionProps) {
  const { t } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const { submitting, submit } = useAnswerSubmission(question);
  const pictureUri = useMemo(
    () => getQuestionPictureUrl(question.bucket_path),
    [question.bucket_path]
  );
  const s = useAppStyles();
  const { keyboardHeight, keyboardVisible } = useKeyboard();

  const answers = useSelector(() => store$.answers.get() as AnswerRow[]);
  const correct = getAnswerKeyForQuestion(answers, question.id);
  const answerKeyReady = correct.length > 0;

  const handlePersist = async () => {
    const trimmed = answer.trim();
    const isCorrect = trimmed.toLowerCase() === correct;
    const ok = await submit({ isCorrect, answerText: trimmed });
    if (ok) setAnswer('');
  };

  const handleSubmit = async () => {
    const trimmed = answer.trim();
    if (!trimmed) {
      Alert.alert(t('common.errorTitle'), t('question.error.enterAnswer'));
      return;
    }
    if (!answerKeyReady) {
      Alert.alert(
        t('question.error.pleaseWaitTitle'),
        t('question.error.answerLoading')
      );
      return;
    }
    const confirmed = await confirmAnswer({ answer: trimmed, t });
    if (!confirmed) return;
    await handlePersist();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
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
                style={{
                  width: '100%',
                  aspectRatio: 4 / 3,
                  maxHeight: 250,
                  borderRadius: 8,
                }}
                resizeMode="contain"
              />
            </InfoBox>
          ) : null}

          <InfoBox mb={0}>
            <ThemedTextInput
              style={[globalStyles.skillStyles.input]}
              value={answer}
              onChangeText={(text: string) => setAnswer(text)}
              placeholder={t('question.placeholder.answer')}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={handleSubmit}
            />
          </InfoBox>

          <InfoBox mb={0}>
            <UIButton
              color={
                answer.trim() !== '' && answerKeyReady
                  ? Colors.dhbwRed
                  : Colors.dhbwGray
              }
              disabled={answer.trim() === '' || !answerKeyReady || submitting}
              loading={submitting}
              onPress={handleSubmit}
            >
              {t('question.submit')}
            </UIButton>
          </InfoBox>
        </VStack>
      </ThemedScrollView>
      {question.hint ? <Hint hint={question.hint} /> : null}
    </KeyboardAvoidingView>
  );
}
