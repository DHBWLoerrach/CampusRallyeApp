import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import UIButton from '@/components/ui/UIButton';
import { supabase } from '@/utils/Supabase';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedText from '@/components/themed/ThemedText';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import { useAppStyles } from '@/utils/AppStyles';
import { Screen } from '@/components/ui/Screen';
import RallyeContextBar from '@/components/rallye/RallyeContextBar';

type QuestionJoinRow = {
  question_id: number;
  questions:
    | {
        id: number;
        content: string | null;
        type: string | null;
      }
    | {
        id: number;
        content: string | null;
        type: string | null;
      }[]
    | null;
};

type RallyeTeamRow = {
  id: number;
  name?: string | null;
  team_name?: string | null;
};

type TeamQuestionRow = {
  question_id: number;
  team_id: number;
  team_answer: string | null;
};

type VotedQuestionRow = {
  question_id: number;
};

type VotingCandidate = {
  teamId: number;
  teamName: string;
  teamAnswer: string;
};

type VotingQuestionGroup = {
  questionId: number;
  questionContent: string;
  questionType: string;
  candidates: VotingCandidate[];
};

type VotingLoadState = 'loading' | 'ready' | 'unavailable' | 'error';

function normalizeQuestionRow(
  row: QuestionJoinRow
): Omit<VotingQuestionGroup, 'candidates'> | null {
  const question = Array.isArray(row.questions)
    ? row.questions[0]
    : row.questions;
  if (!question || typeof row.question_id !== 'number') return null;

  return {
    questionId: row.question_id,
    questionContent:
      typeof question.content === 'string' ? question.content : '',
    questionType:
      typeof question.type === 'string' ? question.type : 'knowledge',
  };
}

function shouldShowAnswerInVoting(questionType: string) {
  return questionType !== 'upload';
}

export default function Voting({
  onRefresh,
  loading,
}: {
  onRefresh: () => void;
  loading: boolean;
}) {
  const [loadState, setLoadState] = useState<VotingLoadState>('loading');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [currentVotingIdx, setCurrentVotingIdx] = useState(0);
  const [sendingResult, setSendingResult] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [votableQuestionGroups, setVotableQuestionGroups] = useState<
    VotingQuestionGroup[]
  >([]);
  const submittingVoteRef = useRef(false);
  const rallye = useSelector(() => store$.rallye.get());
  const team = useSelector(() => store$.team.get());
  const s = useAppStyles();
  const { t } = useLanguage();
  const rallyeId = rallye?.id;
  const teamId = team?.id;

  const loadVotingData = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      // A background reload (pull-to-refresh) keeps the current screen so the
      // list stays visible; only the initial load shows the full-screen spinner.
      if (!background) setLoadState('loading');
      if (!rallyeId || !teamId) {
        setVotableQuestionGroups([]);
        setLoadState('unavailable');
        return;
      }

      try {
        const [questionResponse, teamResponse, votedQuestionResponse] =
          await Promise.all([
            supabase
              .from('join_rallye_questions')
              .select('question_id, questions!inner(id, content, type)')
              .eq('rallye_id', rallyeId)
              .eq('is_voting', true),
            supabase
              .from('rallye_team')
              .select('id, name')
              .eq('rallye_id', rallyeId),
            supabase.rpc('get_voted_voting_question_ids', {
              rallye_id_param: rallyeId,
              voting_team_id_param: teamId,
            }),
          ]);

        if (questionResponse.error) throw questionResponse.error;
        if (teamResponse.error) throw teamResponse.error;
        if (votedQuestionResponse.error) throw votedQuestionResponse.error;

        const questionRows = (questionResponse.data || []) as QuestionJoinRow[];
        const teamRows = (teamResponse.data || []) as RallyeTeamRow[];
        const votedQuestions = (votedQuestionResponse.data ||
          []) as VotedQuestionRow[];

        const questions = questionRows
          .map(normalizeQuestionRow)
          .filter(
            (row): row is Omit<VotingQuestionGroup, 'candidates'> =>
              row !== null
          );
        const otherTeams = teamRows.filter(
          (candidate) => candidate.id !== teamId
        );
        const candidateTeamIds = otherTeams.map((candidate) => candidate.id);

        if (questions.length === 0 || candidateTeamIds.length === 0) {
          setVotableQuestionGroups([]);
          setCurrentVotingIdx(0);
          setSelectedTeam(null);
          setLoadState('unavailable');
          return;
        }

        const { data: answerData, error: answerError } = await supabase
          .from('team_questions')
          .select('question_id, team_id, team_answer')
          .in(
            'question_id',
            questions.map((question) => question.questionId)
          )
          .in('team_id', candidateTeamIds);
        if (answerError) throw answerError;

        const votedQuestionIds = new Set<number>(
          votedQuestions.map((vote) => vote.question_id)
        );
        const teamNameById = new Map<number, string>();
        for (const teamRow of otherTeams) {
          const rawName =
            typeof teamRow.name === 'string'
              ? teamRow.name
              : typeof teamRow.team_name === 'string'
                ? teamRow.team_name
                : '';
          teamNameById.set(teamRow.id, rawName.trim() || `Team ${teamRow.id}`);
        }

        const groupedCandidates = new Map<number, VotingCandidate[]>();
        for (const answer of (answerData || []) as TeamQuestionRow[]) {
          const teamAnswer =
            typeof answer.team_answer === 'string'
              ? answer.team_answer.trim()
              : '';
          if (!teamAnswer) continue;

          const teamName = teamNameById.get(answer.team_id);
          if (!teamName) continue;

          const existingForQuestion =
            groupedCandidates.get(answer.question_id) || [];
          if (
            existingForQuestion.some(
              (candidate) => candidate.teamId === answer.team_id
            )
          )
            continue;

          existingForQuestion.push({
            teamId: answer.team_id,
            teamName,
            teamAnswer,
          });
          groupedCandidates.set(answer.question_id, existingForQuestion);
        }

        const eligibleGroups = questions
          .map((question) => ({
            ...question,
            candidates: groupedCandidates.get(question.questionId) || [],
          }))
          .filter((question) => question.candidates.length >= 2);
        const nextGroups = eligibleGroups.filter(
          (question) => !votedQuestionIds.has(question.questionId)
        );

        setVotableQuestionGroups(nextGroups);
        setCurrentVotingIdx(0);
        setSelectedTeam(null);
        setLoadState(eligibleGroups.length > 0 ? 'ready' : 'unavailable');
      } catch (error) {
        console.error('Error fetching voting questions:', error);
        setVotableQuestionGroups([]);
        setCurrentVotingIdx(0);
        setSelectedTeam(null);
        setLoadState('error');
      }
    },
    [rallyeId, teamId]
  );

  useEffect(() => {
    void loadVotingData();
  }, [loadVotingData]);

  const handleRetry = useCallback(async () => {
    await loadVotingData();
    await onRefresh();
  }, [loadVotingData, onRefresh]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadVotingData({ background: true });
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [loadVotingData, onRefresh]);

  const currentQuestion = useMemo(
    () => votableQuestionGroups[currentVotingIdx] || null,
    [currentVotingIdx, votableQuestionGroups]
  );
  const votingAllowed = votableQuestionGroups.length > currentVotingIdx;

  const handleNextQuestion = async () => {
    if (submittingVoteRef.current) return;
    if (!rallyeId || !teamId || !currentQuestion || !selectedTeam) return;

    submittingVoteRef.current = true;
    try {
      setSendingResult(true);
      const { error } = await supabase.rpc('cast_voting_vote', {
        rallye_id_param: rallyeId,
        question_id_param: currentQuestion.questionId,
        voting_team_id_param: teamId,
        voted_for_team_id_param: selectedTeam,
      });
      if (error) throw error;
      setCurrentVotingIdx((index) => index + 1);
      setSelectedTeam(null);
    } catch (error) {
      console.error('Error saving vote:', error);
      Alert.alert(t('common.errorTitle'), t('voting.error.submit'));
    } finally {
      setSendingResult(false);
      submittingVoteRef.current = false;
    }
  };

  if (loadState === 'loading') {
    return (
      <Screen
        padding="none"
        contentStyle={[
          globalStyles.default.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.dhbwRed} />
        <ThemedText variant="body" style={[s.muted, { marginTop: 10 }]}>
          {t('common.loading')}
        </ThemedText>
      </Screen>
    );
  }

  if (loadState !== 'ready' || !votingAllowed) {
    const titleKey =
      loadState === 'error'
        ? 'common.errorTitle'
        : loadState === 'unavailable'
          ? 'voting.unavailable.title'
          : 'voting.ended.title';
    const messageKey =
      loadState === 'error'
        ? 'voting.error.load'
        : loadState === 'unavailable'
          ? 'voting.unavailable.message'
          : 'voting.ended.message';

    return (
      <Screen padding="none" contentStyle={globalStyles.default.container}>
        <VStack style={{ width: '100%' }} gap={2}>
          <InfoBox mb={2}>
            <ThemedText
              variant="title"
              style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
            >
              {t(titleKey)}
            </ThemedText>
            <ThemedText
              variant="body"
              style={[
                globalStyles.rallyeStatesStyles.infoSubtitle,
                s.muted,
                { marginTop: 10 },
              ]}
            >
              {t(messageKey)}
            </ThemedText>
          </InfoBox>
          <InfoBox mb={2}>
            <UIButton icon="rotate" disabled={loading} onPress={handleRetry}>
              {t('common.refresh')}
            </UIButton>
          </InfoBox>
        </VStack>
      </Screen>
    );
  }

  return (
    <Screen
      padding="none"
      edges={['bottom']}
      contentStyle={[globalStyles.default.container, { flex: 1 }]}
    >
      <FlatList
        testID="voting-list"
        data={currentQuestion?.candidates || []}
        keyExtractor={(item) => `${currentQuestion?.questionId}-${item.teamId}`}
        onRefresh={handleRefresh}
        refreshing={loading || refreshing}
        ListHeaderComponent={() => (
          <View style={{ paddingTop: 10, paddingBottom: 30 }}>
            <RallyeContextBar />
            {currentQuestion ? (
              <InfoBox mb={2}>
                <ThemedText
                  variant="title"
                  style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
                >
                  {currentQuestion.questionContent}
                </ThemedText>
                <ThemedText
                  variant="body"
                  style={[
                    globalStyles.rallyeStatesStyles.infoSubtitle,
                    s.muted,
                    { marginTop: 10 },
                  ]}
                >
                  {t('voting.instruction')}
                </ThemedText>
              </InfoBox>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`vote-option-${currentQuestion?.questionId}-${item.teamId}`}
            onPress={() => setSelectedTeam(item.teamId)}
            activeOpacity={1.0}
            style={{ alignItems: 'flex-start', paddingTop: 10, width: '100%' }}
          >
            <InfoBox
              mb={2}
              style={{
                borderColor:
                  selectedTeam === item.teamId ? Colors.dhbwRed : 'transparent',
                borderWidth: selectedTeam === item.teamId ? 2 : 0,
              }}
            >
              {currentQuestion &&
              shouldShowAnswerInVoting(currentQuestion.questionType) ? (
                <>
                  <ThemedText
                    variant="title"
                    style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
                  >
                    {item.teamAnswer}
                  </ThemedText>
                  <ThemedText
                    variant="body"
                    style={[
                      globalStyles.rallyeStatesStyles.infoSubtitle,
                      s.muted,
                    ]}
                  >
                    {item.teamName}
                  </ThemedText>
                </>
              ) : (
                <ThemedText
                  variant="title"
                  style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
                >
                  {item.teamName}
                </ThemedText>
              )}
            </InfoBox>
          </TouchableOpacity>
        )}
        contentContainerStyle={[{ padding: 10 }]}
      />
      <View style={{ padding: 10 }}>
        <InfoBox mb={2}>
          <UIButton
            disabled={!selectedTeam || sendingResult}
            onPress={handleNextQuestion}
          >
            {t('voting.next')}
          </UIButton>
        </InfoBox>
      </View>
    </Screen>
  );
}
