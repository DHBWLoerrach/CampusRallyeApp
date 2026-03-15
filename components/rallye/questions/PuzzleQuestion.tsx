import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import {
  QuestionProps,
  AnswerRow,
  PuzzleGroup,
  PuzzleFragmentWithQuestion,
  Question,
} from '@/types/rallye';
import { useAppStyles } from '@/utils/AppStyles';
import Colors from '@/utils/Colors';
import { confirmAnswer } from '@/utils/ConfirmAlert';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { getAnswerKeyForQuestion } from '@/utils/answerRows';
import { submitAnswerAndAdvance } from '@/services/storage/answerSubmission';
import { store$ } from '@/services/storage/Store';
import { supabase } from '@/utils/Supabase';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';

export default function PuzzleQuestion({ question }: QuestionProps) {
  const { t } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingFragments, setLoadingFragments] = useState(true);
  const [puzzleGroup, setPuzzleGroup] = useState<PuzzleGroup | null>(null);
  const [fragments, setFragments] = useState<PuzzleFragmentWithQuestion[]>([]);
  const s = useAppStyles();

  const team = store$.team.get();
  const answers = useSelector(() => store$.answers.get() as AnswerRow[]);
  const correctText = getAnswerKeyForQuestion(answers, question.id);
  const answerKeyReady = correctText.length > 0;

  // Load puzzle configuration and fragments
  useEffect(() => {
    let mounted = true;

    const loadPuzzleData = async () => {
      try {
        // Load puzzle group
        const { data: groupData, error: groupError } = await supabase
          .from('puzzle_groups')
          .select('*')
          .eq('puzzle_question_id', question.id)
          .single();

        if (groupError) throw groupError;
        if (!mounted || !groupData) return;

        setPuzzleGroup(groupData);

        // Load fragments with their questions
        const { data: fragmentsData, error: fragmentsError } = await supabase
          .from('puzzle_fragments')
          .select('*')
          .eq('group_id', groupData.id)
          .order('order_index', { ascending: true });

        if (fragmentsError) throw fragmentsError;
        if (!mounted || !fragmentsData) return;

        // Load fragment questions
        const fragmentQuestionIds = fragmentsData.map(
          (f: any) => f.fragment_question_id
        );

        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .in('id', fragmentQuestionIds);

        if (questionsError) throw questionsError;
        if (!mounted) return;

        // Map questions to their fragments
        const questionsMap = new Map(
          (questionsData || []).map((q: any) => [
            q.id,
            {
              ...q,
              question: q.content,
              question_type: q.type,
            } as Question,
          ])
        );

        const fragmentsWithQuestions = fragmentsData.map((f: any) => ({
          ...f,
          fragment_question: questionsMap.get(f.fragment_question_id)!,
        }));

        setFragments(fragmentsWithQuestions);
      } catch (error) {
        console.error('Error loading puzzle data:', error);
        Alert.alert(t('common.errorTitle'), 'Puzzle-Fragmente konnten nicht geladen werden.');
      } finally {
        if (mounted) setLoadingFragments(false);
      }
    };

    loadPuzzleData();

    return () => {
      mounted = false;
    };
  }, [question.id, t]);

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
      Alert.alert(t('common.errorTitle'), t('question.error.saveAnswer'));
    } finally {
      setSubmitting(false);
    }
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

  if (loadingFragments) {
    return (
      <ThemedScrollView
        variant="background"
        contentContainerStyle={globalStyles.default.refreshContainer}
      >
        <VStack style={globalStyles.default.container} gap={2}>
          <ThemedText style={s.text}>{t('common.loading')}</ThemedText>
        </VStack>
      </ThemedScrollView>
    );
  }

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

        {/* Fragment Tasks */}
        {fragments.length > 0 && (
          <InfoBox mb={0}>
            <ThemedText
              variant="body"
              style={[s.text, { fontWeight: '600', marginBottom: 12 }]}
            >
              Aufgaben ({fragments.length}):
            </ThemedText>
            {fragments.map((fragment, index) => {
              const isCompleted = false; // TODO: Track completion
              return (
                <View
                  key={fragment.id}
                  style={{
                    marginBottom: index < fragments.length - 1 ? 12 : 0,
                    paddingBottom: index < fragments.length - 1 ? 12 : 0,
                    borderBottomWidth: index < fragments.length - 1 ? 1 : 0,
                    borderBottomColor: Colors.lightGray,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: isCompleted
                          ? Colors.dhbwRed
                          : 'transparent',
                        borderWidth: 2,
                        borderColor: isCompleted
                          ? Colors.dhbwRed
                          : Colors.mediumGray,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 2,
                      }}
                    >
                      {isCompleted && (
                        <ThemedText
                          style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}
                        >
                          ✓
                        </ThemedText>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        variant="body"
                        style={[s.text, { fontWeight: '500', marginBottom: 4 }]}
                      >
                        {fragment.fragment_question.question}
                      </ThemedText>
                      {fragment.location_hint && (
                        <ThemedText
                          variant="body"
                          style={[s.text, { fontSize: 13, opacity: 0.7 }]}
                        >
                          📍 {fragment.location_hint}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </InfoBox>
        )}

        <InfoBox mb={0}>
          <ThemedTextInput
            style={[globalStyles.skillStyles.input]}
            placeholder={t('question.placeholder.answer')}
            value={answer}
            onChangeText={setAnswer}
            editable={!submitting}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={handleSubmit}
          />
        </InfoBox>

        <InfoBox mb={0}>
          <UIButton
            onPress={handleSubmit}
            disabled={submitting || !answer.trim()}
            loading={submitting}
            color={
              answer.trim() && answerKeyReady
                ? Colors.dhbwRed
                : Colors.dhbwGray
            }
          >
            {t('question.submit')}
          </UIButton>
        </InfoBox>

        {question.hint && <Hint hint={question.hint} />}
      </VStack>
    </ThemedScrollView>
  );
}
