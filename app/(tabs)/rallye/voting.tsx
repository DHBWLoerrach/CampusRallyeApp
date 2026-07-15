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
import {
  castVote,
  getTeamAnswersForQuestions,
  getVotingSourceData,
  type VotingQuestionJoinRow,
} from '@/services/storage/votingStorage';
import UIButton from '@/components/ui/UIButton';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedText from '@/components/themed/ThemedText';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import { useAppStyles } from '@/utils/AppStyles';
import { Screen } from '@/components/ui/Screen';
import RallyeContextBar from '@/components/rallye/RallyeContextBar';

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
  row: VotingQuestionJoinRow
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
        const {
          questionRows,
          teamRows,
          votedQuestionRows: votedQuestions,
        } = await getVotingSourceData(rallyeId, teamId);

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

        const answerData = await getTeamAnswersForQuestions(
          questions.map((question) => question.questionId),
          candidateTeamIds
        );

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
        for (const answer of answerData) {
          const teamAnswer =
            typeof answer.answer === 'string' ? answer.answer.trim() : '';
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
      await castVote({
        rallyeId,
        questionId: currentQuestion.questionId,
        votingTeamId: teamId,
        votedForTeamId: selectedTeam,
      });
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
