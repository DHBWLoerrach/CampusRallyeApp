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
import { confirmAnswer, confirm } from '@/utils/ConfirmAlert';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { getAnswerKeyForQuestion } from '@/utils/answerRows';
import { submitAnswerAndAdvance, submitAnswerOnly } from '@/services/storage/answerSubmission';
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
  const [surrenderedFragmentIds, setSurrenderedFragmentIds] = useState<Set<number>>(new Set());
  const [activeFragmentIndex, setActiveFragmentIndex] = useState<number | null>(null);
  const [visibleUpTo, setVisibleUpTo] = useState(0);
  const [puzzleVisible, setPuzzleVisible] = useState<boolean>(true);
  const [teamAnswers, setTeamAnswers] = useState<Map<number, string>>(new Map());
  const [teamAnswerCorrectness, setTeamAnswerCorrectness] = useState<Map<number, boolean>>(new Map());
  const s = useAppStyles();

  const team = store$.team.get();
  const answers = useSelector(() => store$.answers.get() as AnswerRow[]);
  const correctText = getAnswerKeyForQuestion(answers, question.id);
  const answerKeyReady = correctText.length > 0;

  const allFragmentsCompleted = !team || fragments.length === 0 ||
    fragments.every(f => completedFragmentIds.has(f.fragment_question_id));

  // Stricter check: requires actual fragment data and a team — used to unlock hidden main question
  const fragmentsExplicitlyCompleted =
    team != null &&
    fragments.length > 0 &&
    fragments.every(f => completedFragmentIds.has(f.fragment_question_id));

  const mainQuestionUnlocked = puzzleVisible || fragmentsExplicitlyCompleted;

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
        setPuzzleVisible(groupData.visible ?? true);

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
            .select('question_id, team_answer, correct')
            .eq('team_id', teamId)
            .in('question_id', fragmentQuestionIds);
          if (mounted && completedData) {
            const completedSet = new Set(completedData.map((r: any) => r.question_id));
            setCompletedFragmentIds(completedSet);
            const answersMap = new Map<number, string>();
            const correctnessMap = new Map<number, boolean>();
            completedData.forEach((r: any) => {
              if (r.team_answer) answersMap.set(r.question_id, r.team_answer);
              correctnessMap.set(r.question_id, !!r.correct);
            });
            setTeamAnswers(answersMap);
            setTeamAnswerCorrectness(correctnessMap);
            // Advance visibleUpTo to the first uncompleted fragment
            const firstIncomplete = fragmentsWithQuestions.findIndex(
              (f: any) => !completedSet.has(f.fragment_question_id)
            );
            setVisibleUpTo(
              firstIncomplete === -1
                ? fragmentsWithQuestions.length - 1
                : firstIncomplete
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

  const handleFragmentAnswered = async (fragmentQuestionId: number) => {
    setCompletedFragmentIds(prev => new Set([...prev, fragmentQuestionId]));
    setActiveFragmentIndex(null);
    // Fetch the team's actual answer for display
    const teamId = team?.id;
    if (teamId) {
      const { data } = await supabase
        .from('team_questions')
        .select('team_answer, correct')
        .eq('team_id', teamId)
        .eq('question_id', fragmentQuestionId)
        .single();
      if (data) {
        if (data.team_answer) {
          setTeamAnswers(prev => new Map(prev).set(fragmentQuestionId, data.team_answer));
        }
        setTeamAnswerCorrectness(prev => new Map(prev).set(fragmentQuestionId, !!data.correct));
      }
    }
  };

  const handleFragmentSurrender = async () => {
    if (activeFragmentIndex === null) return;
    const fragment = fragments[activeFragmentIndex];
    const confirmed = await confirm({
      title: t('confirm.surrender.title'),
      message: t('confirm.surrender.message'),
      confirmText: t('confirm.surrender.confirm'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await submitAnswerOnly({
        teamId: team?.id ?? null,
        questionId: fragment.fragment_question_id,
        answeredCorrectly: false,
        pointsAwarded: 0,
      });
      setCompletedFragmentIds(prev => new Set([...prev, fragment.fragment_question_id]));
      setSurrenderedFragmentIds(prev => new Set([...prev, fragment.fragment_question_id]));
      setActiveFragmentIndex(null);
    } catch (e) {
      console.error('Error surrendering fragment:', e);
      Alert.alert(t('common.errorTitle'), t('question.error.surrender'));
    }
  };

  const handleMainSurrender = async () => {
    const confirmed = await confirm({
      title: t('confirm.surrender.title'),
      message: t('confirm.surrender.message'),
      confirmText: t('confirm.surrender.confirm'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await submitAnswerAndAdvance({
        teamId: team?.id ?? null,
        questionId: question.id,
        answeredCorrectly: false,
        pointsAwarded: 0,
      });
    } catch (e) {
      console.error('Error surrendering puzzle:', e);
      Alert.alert(t('common.errorTitle'), t('question.error.surrender'));
    }
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
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', gap: 8 }}>
          <UIButton
            color={Colors.dhbwGray}
            onPress={() => setActiveFragmentIndex(null)}
            style={{ flex: 1 }}
          >
            {t('puzzle.backToPuzzle')}
          </UIButton>
          <UIButton
            color={Colors.dhbwGray}
            onPress={handleFragmentSurrender}
            style={{ flex: 1 }}
          >
            {t('common.surrender')}
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
    <View style={{ flex: 1 }}>
    <ThemedScrollView
      variant="background"
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        (question.hint && mainQuestionUnlocked) ? { paddingBottom: 88 } : undefined,
      ]}
    >
      <VStack
        style={[globalStyles.default.container, { alignItems: 'stretch' }]}
        gap={2}
      >
        {mainQuestionUnlocked && (
          <InfoBox mb={0}>
            <ThemedText
              variant="title"
              style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
            >
              {question.question}
            </ThemedText>
          </InfoBox>
        )}

        {/* Fragment Tasks */}
        {fragments.length > 0 && (
          <InfoBox mb={0} maxHeight={9999}>
            <ThemedText
              variant="body"
              style={[s.text, { fontWeight: '600', marginBottom: 4 }]}
            >
              {t('puzzle.fragment.tasks')}
            </ThemedText>
            <ThemedText
              variant="body"
              style={[s.text, { fontSize: 13, opacity: 0.6, marginBottom: 12 }]}
            >
              {t('puzzle.fragment.progress', { completed: completedFragmentIds.size, total: fragments.length })}
            </ThemedText>
            {fragments.slice(0, visibleUpTo + 1).map((fragment, index) => {
              const isCompleted = completedFragmentIds.has(fragment.fragment_question_id);
              const isSurrendered = surrenderedFragmentIds.has(fragment.fragment_question_id);
              const isCorrect = teamAnswerCorrectness.get(fragment.fragment_question_id) ?? false;
              const fragmentAnswer = isCompleted && !isSurrendered
                ? (teamAnswers.get(fragment.fragment_question_id) || '')
                : '';
              return (
                <Pressable
                  key={fragment.id}
                  onPress={() => {
                    if (!isCompleted) setActiveFragmentIndex(index);
                  }}
                  disabled={isCompleted}
                  style={{
                    marginBottom: index < visibleUpTo ? 12 : 0,
                    paddingBottom: index < visibleUpTo ? 12 : 0,
                    borderBottomWidth: index < visibleUpTo ? 1 : 0,
                    borderBottomColor: Colors.lightGray,
                    opacity: isCompleted ? 0.6 : 1,
                  }}
                >
                  <View>
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
                          style={{ color: isSurrendered ? Colors.dhbwGray : isCorrect ? Colors.dhbwRed : Colors.dhbwGray, fontSize: 13, marginTop: 4 }}
                        >
                          {isSurrendered
                            ? `✗ ${t('puzzle.fragment.surrendered')}`
                            : isCorrect
                              ? `✓ ${fragmentAnswer || t('puzzle.fragment.completed')}`
                              : `✗ ${fragmentAnswer || t('puzzle.fragment.completed')}`}
                        </ThemedText>
                      )}
                  </View>
                </Pressable>
              );
            })}
            {completedFragmentIds.has(fragments[visibleUpTo]?.fragment_question_id) &&
              visibleUpTo < fragments.length - 1 && (
              <UIButton
                onPress={() => setVisibleUpTo(prev => prev + 1)}
                color={Colors.dhbwRed}
                style={{ marginTop: 12 }}
              >
                {t('puzzle.fragment.next')}
              </UIButton>
            )}
          </InfoBox>
        )}

        {allFragmentsCompleted && (
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
        )}

        {allFragmentsCompleted && (
          <InfoBox mb={0}>
            <UIButton
              onPress={handleSubmit}
              disabled={submitting || !answer.trim()}
              loading={submitting}
              color={answer.trim() && answerKeyReady ? Colors.dhbwRed : Colors.dhbwGray}
            >
              {t('question.submit')}
            </UIButton>
          </InfoBox>
        )}

        {allFragmentsCompleted && (
          <InfoBox mb={0}>
            <UIButton
              onPress={handleMainSurrender}
              disabled={submitting}
              color={Colors.dhbwGray}
            >
              {t('common.surrender')}
            </UIButton>
          </InfoBox>
        )}

      </VStack>
    </ThemedScrollView>
      {question.hint && mainQuestionUnlocked && <Hint hint={question.hint} />}
    </View>
  );
}
