import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import {
  QuestionProps,
  AnswerRow,
  PuzzleFragmentWithQuestion,
  Question,
  QuestionType,
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
import SkillQuestion from '@/components/rallye/questions/SkillQuestion';
import MultipleChoiceQuestion from '@/components/rallye/questions/MultipleChoiceQuestion';
import QRCodeQuestion from '@/components/rallye/questions/QRCodeQuestion';
import ImageQuestion from '@/components/rallye/questions/ImageQuestion';
import UploadPhotoQuestion from '@/components/rallye/questions/UploadPhotoQuestion';

const fragmentComponents: Partial<Record<QuestionType, React.ComponentType<QuestionProps>>> = {
  knowledge: SkillQuestion,
  upload: UploadPhotoQuestion,
  qr_code: QRCodeQuestion,
  multiple_choice: MultipleChoiceQuestion,
  picture: ImageQuestion,
};

export default function PuzzleQuestion({ question }: QuestionProps) {
  const { t } = useLanguage();
  const [answer, setAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingFragments, setLoadingFragments] = useState(true);
  const [fragments, setFragments] = useState<PuzzleFragmentWithQuestion[]>([]);
  const [completedFragmentIds, setCompletedFragmentIds] = useState<Set<number>>(new Set());
  const [activeFragmentIndex, setActiveFragmentIndex] = useState<number | null>(null);
  const s = useAppStyles();

  const team = store$.team.get();
  const answers = useSelector(() => store$.answers.get() as AnswerRow[]);
  const correctText = getAnswerKeyForQuestion(answers, question.id);
  const answerKeyReady = correctText.length > 0;

  const allFragmentsCompleted = !team || fragments.length === 0 ||
    fragments.every(f => completedFragmentIds.has(f.fragment_question_id));
  const remainingCount = fragments.filter(
    f => !completedFragmentIds.has(f.fragment_question_id)
  ).length;

  // Load puzzle configuration, fragments, and their answers
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

        // Load answers for fragment questions and merge into store
        if (fragmentQuestionIds.length > 0) {
          const { data: fragmentAnswers } = await supabase
            .from('answers')
            .select('*')
            .in('question_id', fragmentQuestionIds);
          if (mounted && fragmentAnswers && fragmentAnswers.length > 0) {
            const currentAnswers = store$.answers.get() as AnswerRow[];
            const existingIds = new Set(currentAnswers.map(a => a.id));
            const newAnswers = fragmentAnswers.filter(
              (a: any) => !existingIds.has(a.id)
            );
            if (newAnswers.length > 0) {
              store$.answers.set([...currentAnswers, ...newAnswers]);
            }
          }
        }

        // Check which fragments are already completed
        const teamId = store$.team.get()?.id;
        if (teamId && fragmentQuestionIds.length > 0) {
          const { data: completedData } = await supabase
            .from('team_questions')
            .select('question_id')
            .eq('team_id', teamId)
            .in('question_id', fragmentQuestionIds);
          if (mounted && completedData) {
            setCompletedFragmentIds(
              new Set(completedData.map((r: any) => r.question_id))
            );
          }
        }
      } catch (error) {
        console.error('Error loading puzzle data:', error);
        Alert.alert(t('common.errorTitle'), t('puzzle.error.loadFragments'));
      } finally {
        if (mounted) setLoadingFragments(false);
      }
    };

    loadPuzzleData();

    return () => {
      mounted = false;
    };
  }, [question.id, t]);

  const handleFragmentAnswered = (fragmentQuestionId: number) => {
    setCompletedFragmentIds(prev => new Set([...prev, fragmentQuestionId]));
    setActiveFragmentIndex(null);
  };

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
    if (!allFragmentsCompleted) {
      Alert.alert(
        t('puzzle.error.fragmentsIncompleteTitle'),
        t('puzzle.error.fragmentsIncompleteMessage')
      );
      return;
    }
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

  // Render active fragment question
  if (activeFragmentIndex !== null) {
    const fragment = fragments[activeFragmentIndex];
    const FragmentCmp = fragmentComponents[fragment.fragment_question.question_type];

    if (!FragmentCmp) {
      // Unsupported fragment type — gracefully fall back to puzzle overview
      return (
        <View style={{ flex: 1, padding: 16 }}>
          <UIButton
            icon="arrow-left"
            color={Colors.dhbwGray}
            onPress={() => setActiveFragmentIndex(null)}
          >
            {t('puzzle.backToPuzzle')}
          </UIButton>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
          <UIButton
            icon="arrow-left"
            color={Colors.dhbwGray}
            onPress={() => setActiveFragmentIndex(null)}
          >
            {t('puzzle.backToPuzzle')}
          </UIButton>
        </View>
        <FragmentCmp
          key={fragment.fragment_question_id}
          question={fragment.fragment_question}
          onAnswered={() => handleFragmentAnswered(fragment.fragment_question_id)}
        />
      </View>
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
              {t('puzzle.fragment.tasks', { count: fragments.length })}
            </ThemedText>
            {fragments.map((fragment, index) => {
              const isCompleted = completedFragmentIds.has(fragment.fragment_question_id);
              return (
                <Pressable
                  key={fragment.id}
                  onPress={() => {
                    if (!isCompleted) setActiveFragmentIndex(index);
                  }}
                  disabled={isCompleted}
                  style={{
                    marginBottom: index < fragments.length - 1 ? 12 : 0,
                    paddingBottom: index < fragments.length - 1 ? 12 : 0,
                    borderBottomWidth: index < fragments.length - 1 ? 1 : 0,
                    borderBottomColor: Colors.lightGray,
                    opacity: isCompleted ? 0.6 : 1,
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
                      {!isCompleted && (
                        <ThemedText
                          variant="body"
                          style={{ color: Colors.dhbwRed, fontSize: 13, marginTop: 4 }}
                        >
                          {t('puzzle.fragment.answer')} →
                        </ThemedText>
                      )}
                      {isCompleted && (
                        <ThemedText
                          variant="body"
                          style={{ color: Colors.dhbwRed, fontSize: 13, marginTop: 4 }}
                        >
                          ✓ {t('puzzle.fragment.completed')}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </InfoBox>
        )}

        {fragments.length > 0 && !allFragmentsCompleted && (
          <InfoBox mb={0}>
            <ThemedText variant="body" style={[s.text, { textAlign: 'center' }]}>
              {t('puzzle.fragmentsRemaining', { count: remainingCount })}
            </ThemedText>
          </InfoBox>
        )}

        <InfoBox mb={0}>
          <ThemedTextInput
            style={[globalStyles.skillStyles.input]}
            placeholder={t('question.placeholder.answer')}
            value={answer}
            onChangeText={setAnswer}
            editable={!submitting && allFragmentsCompleted}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={handleSubmit}
          />
        </InfoBox>

        <InfoBox mb={0}>
          <UIButton
            onPress={handleSubmit}
            disabled={submitting || !answer.trim() || !allFragmentsCompleted}
            loading={submitting}
            color={
              answer.trim() && answerKeyReady && allFragmentsCompleted
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
