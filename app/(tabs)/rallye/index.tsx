import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl } from 'react-native';
import { observer, useSelector } from '@legendapp/state/react';
import NetInfo from '@react-native-community/netinfo';
import { store$ } from '@/services/storage/Store';
import {
  getAnsweredQuestionIds,
  getQuestionsWithGeocachingMetadata,
  getRallyeDynamicFields,
  getRallyeQuestionIds,
  getSolutionOptions,
} from '@/services/storage/rallyeStorage';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { useAppStyles } from '@/utils/AppStyles';
import { orderQuestionsForSession } from '@/utils/orderQuestions';
import { spacing } from '@/utils/spacing';
import Preparation from '@/app/(tabs)/rallye/states/Preparation';
import NoQuestions from '@/app/(tabs)/rallye/states/NoQuestions';
import TeamSetup from '@/app/(tabs)/rallye/team-setup';
import Voting from '@/app/(tabs)/rallye/voting';
import Scoreboard from '@/app/(tabs)/rallye/scoreboard';
import QuestionRenderer from '@/app/(tabs)/rallye/question-renderer';
import ThemedText from '@/components/themed/ThemedText';
import RallyeContextBar from '@/components/rallye/RallyeContextBar';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import UIButton from '@/components/ui/UIButton';
import { ScreenScrollView } from '@/components/ui/Screen';
import type { RallyeStatus } from '@/types/rallye';

function isPreparation(status?: RallyeStatus) {
  return status === 'draft' || status === 'ready';
}

const RallyeIndex = observer(function RallyeIndex() {
  const { t } = useLanguage();
  const tRef = useRef(t);
  const [loading, setLoading] = useState(false);
  const s = useAppStyles();

  const rallye = useSelector(() => store$.rallye.get());
  const team = useSelector(() => store$.team.get());
  const idx = useSelector(() => store$.questionIndex.get());
  const qsLen = useSelector(() => store$.questions.get().length);
  const totalQuestions = useSelector(() => store$.totalQuestions.get());
  const answeredCount = useSelector(() => store$.answeredCount.get());
  const questions = useSelector(() => store$.questions.get());
  const currentQuestion = useSelector(() => store$.currentQuestion.get());
  const points = useSelector(() => store$.points.get());
  const allQuestionsAnswered = useSelector(() =>
    store$.allQuestionsAnswered.get()
  );
  const isTourMode = useSelector(() => store$.isTourMode.get());

  const rallyeId = rallye?.id;
  const teamId = team?.id;
  const teamRallyeFinished = !isTourMode && allQuestionsAnswered;
  const questionIdsCacheRef = useRef<{
    rallyeId: number;
    ids: number[];
  } | null>(null);
  const questionIdsPromiseRef = useRef<{
    rallyeId: number;
    promise: Promise<number[]>;
  } | null>(null);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const getQuestionIds = useCallback(async (): Promise<number[]> => {
    if (!rallyeId) return [];

    if (questionIdsCacheRef.current?.rallyeId === rallyeId) {
      return questionIdsCacheRef.current.ids;
    }

    if (questionIdsPromiseRef.current?.rallyeId === rallyeId) {
      return questionIdsPromiseRef.current.promise;
    }

    const promise = (async () => {
      const ids = await getRallyeQuestionIds(rallyeId);
      questionIdsCacheRef.current = { rallyeId, ids };
      return ids;
    })();

    questionIdsPromiseRef.current = { rallyeId, promise };

    try {
      return await promise;
    } finally {
      if (questionIdsPromiseRef.current?.rallyeId === rallyeId) {
        questionIdsPromiseRef.current = null;
      }
    }
  }, [rallyeId]);

  const loadAnswers = useCallback(async () => {
    if (!rallyeId) return;
    try {
      const questionIds = await getQuestionIds();
      if (questionIds.length === 0) {
        store$.answers.set([]);
        return;
      }
      const answers = await getSolutionOptions(questionIds);
      store$.answers.set(answers);
    } catch (error) {
      console.error('Error fetching rallye answers:', error);
    }
  }, [getQuestionIds, rallyeId]);

  const loadQuestions = useCallback(async () => {
    if (!rallyeId) return;
    setLoading(true);
    try {
      const questionIds = await getQuestionIds();
      // Track total number of questions for progress display
      store$.totalQuestions.set(questionIds.length);
      if (questionIds.length === 0) {
        store$.questions.set([]);
        store$.questionIndex.set(0);
        store$.answeredCount.set(0);
        return;
      }

      // already answered for team mode
      let answeredIds: number[] = [];
      if (!isTourMode && teamId) {
        answeredIds = await getAnsweredQuestionIds(teamId);
      }
      // Track number of answered questions for progress display
      store$.answeredCount.set(answeredIds.length);

      if (answeredIds.length === questionIds.length && !isTourMode) {
        store$.allQuestionsAnswered.set(true);
        store$.questionIndex.set(0);
        return;
      }

      const filteredIds = isTourMode
        ? questionIds
        : questionIds.filter((id: number) => !answeredIds.includes(id));

      const mapped = await getQuestionsWithGeocachingMetadata(filteredIds);

      const previousQuestions = store$.questions.get();
      const previousCurrentQuestionId = store$.currentQuestion.get()?.id;
      const ordered = orderQuestionsForSession(mapped, previousQuestions);
      const nextQuestionIndex = previousCurrentQuestionId
        ? ordered.findIndex(
            (question) => question.id === previousCurrentQuestionId
          )
        : 0;
      const safeQuestionIndex = nextQuestionIndex >= 0 ? nextQuestionIndex : 0;

      store$.questions.set(ordered);
      store$.currentQuestion.set(ordered[safeQuestionIndex] || null);
      store$.questionIndex.set(safeQuestionIndex);
    } catch (err) {
      console.error('Fehler beim Laden der Fragen:', err);
      Alert.alert(
        tRef.current('common.errorTitle'),
        tRef.current('rallye.error.loadQuestions')
      );
    } finally {
      setLoading(false);
    }
  }, [getQuestionIds, isTourMode, rallyeId, teamId]);

  const refreshStatus = useCallback(async () => {
    if (!rallyeId) return;
    setLoading(true);
    // slight delay to avoid flicker
    await new Promise((r) => setTimeout(r, 600));
    try {
      const data = await getRallyeDynamicFields(rallyeId);
      if (data) {
        store$.rallye.status.set(data.status);
        store$.rallye.rallye_end.set(data.rallye_end);
        if (data.name) store$.rallye.name.set(data.name);
      }
    } catch (e) {
      console.error('Error fetching rallye status:', e);
    } finally {
      setLoading(false);
    }
  }, [rallyeId]);

  useEffect(() => {
    if (!rallyeId) return;
    void loadQuestions();
  }, [loadQuestions, rallyeId]);

  useEffect(() => {
    if (!rallyeId) return;
    void (async () => {
      await loadAnswers();
      // Ensure we refresh dynamic rallye fields like name/status
      await refreshStatus();
    })();
  }, [loadAnswers, rallyeId, refreshStatus]);

  const onRefresh = async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      Alert.alert(t('common.errorTitle'), t('rallye.error.noInternet'));
      return;
    }
    if (rallye?.status === 'running') {
      await loadQuestions();
      await loadAnswers();
      await refreshStatus();
    } else {
      await refreshStatus();
    }
  };

  // Status routing
  if (!rallye) {
    return <NoQuestions loading={loading} onRefresh={onRefresh} />;
  }

  if (isPreparation(rallye.status)) {
    return <Preparation loading={loading} onRefresh={onRefresh} />;
  }

  if (rallye.status === 'voting') {
    return <Voting loading={loading} onRefresh={onRefresh} />;
  }

  if (rallye.status === 'results' || rallye.status === 'ended') {
    return <Scoreboard />;
  }

  if (rallye.status === 'running' && !isTourMode && !team) {
    return <TeamSetup />;
  }

  if (teamRallyeFinished) {
    return (
      <ScreenScrollView
        padding="none"
        edges={['bottom']}
        contentContainerStyle={[
          globalStyles.default.refreshContainer,
          globalStyles.rallyeStatesStyles.container,
        ]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        <VStack style={{ width: '100%' }} gap={2}>
          <InfoBox mb={2}>
            <ThemedText
              variant="title"
              style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
            >
              {t('rallye.allAnswered.simple')}
            </ThemedText>
            {team ? (
              <ThemedText
                variant="body"
                style={[
                  globalStyles.rallyeStatesStyles.infoSubtitle,
                  s.muted,
                  { marginTop: 10 },
                ]}
              >
                {t('rallye.teamLabel', { team: team?.name ?? '' })}
              </ThemedText>
            ) : null}
            <ThemedText
              variant="body"
              style={[globalStyles.rallyeStatesStyles.infoSubtitle, s.muted]}
            >
              {t('rallye.pointsLabel', { points })}
            </ThemedText>
          </InfoBox>
          <InfoBox>
            <ThemedText
              variant="body"
              style={globalStyles.rallyeStatesStyles.meetingPoint}
            >
              {t('rallye.meetingPoint')}
            </ThemedText>
          </InfoBox>
          <InfoBox mb={2}>
            <UIButton
              variant="ghost"
              icon="rotate"
              disabled={loading}
              onPress={onRefresh}
            >
              {t('common.refresh')}
            </UIButton>
          </InfoBox>
        </VStack>
      </ScreenScrollView>
    );
  }

  if (!allQuestionsAnswered && questions.length === 0) {
    return <NoQuestions loading={loading} onRefresh={onRefresh} />;
  }

  if (questions.length > 0 && !allQuestionsAnswered) {
    return (
      <ScreenScrollView
        padding="none"
        edges={[]}
        contentContainerStyle={[
          globalStyles.default.refreshContainer,
          globalStyles.default.container,
          { paddingBottom: spacing(2) },
        ]}
      >
        <RallyeContextBar />
        <ThemedText variant="bodyStrong" style={{ marginBottom: 8 }}>
          {t('rallye.progress', {
            current: isTourMode
              ? idx + 1
              : Math.min((answeredCount || 0) + 1, totalQuestions || qsLen),
            total: isTourMode ? qsLen : totalQuestions || qsLen,
          })}
        </ThemedText>
        <QuestionRenderer question={currentQuestion} />
      </ScreenScrollView>
    );
  }

  if (allQuestionsAnswered && isTourMode) {
    // Exploration finished: show simple summary and back to welcome
    return (
      <ScreenScrollView
        padding="none"
        edges={['bottom']}
        contentContainerStyle={[
          globalStyles.default.refreshContainer,
          globalStyles.rallyeStatesStyles.container,
        ]}
      >
        <VStack style={{ width: '100%' }} gap={2}>
          <InfoBox mb={2}>
            <ThemedText
              variant="title"
              style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
            >
              {t('rallye.allAnswered.title')}
            </ThemedText>
            <ThemedText
              variant="body"
              style={[
                globalStyles.rallyeStatesStyles.infoSubtitle,
                s.muted,
                { marginTop: 10 },
              ]}
            >
              {t('rallye.pointsAchieved', { points })}
            </ThemedText>
          </InfoBox>
          <InfoBox mb={2}>
            <UIButton
              variant="ghost"
              icon="arrow-left"
              onPress={() => {
                void store$.leaveRallye();
              }}
            >
              {t('rallye.backToStart')}
            </UIButton>
          </InfoBox>
        </VStack>
      </ScreenScrollView>
    );
  }

  return null;
});

export default RallyeIndex;
