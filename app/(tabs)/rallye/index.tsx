import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl } from 'react-native';
import { observer, useSelector } from '@legendapp/state/react';
import NetInfo from '@react-native-community/netinfo';
import { store$ } from '@/services/storage/Store';
import { supabase } from '@/utils/Supabase';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import Preparation from '@/app/(tabs)/rallye/states/Preparation';
import NoQuestions from '@/app/(tabs)/rallye/states/NoQuestions';
import TeamSetup from '@/app/(tabs)/rallye/team-setup';
import Voting from '@/app/(tabs)/rallye/voting';
import Scoreboard from '@/app/(tabs)/rallye/scoreboard';
import QuestionRenderer from '@/app/(tabs)/rallye/question-renderer';
import ThemedText from '@/components/themed/ThemedText';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import TeamNameSheet from '@/components/ui/TeamNameSheet';
import UIButton from '@/components/ui/UIButton';
import { ScreenScrollView } from '@/components/ui/Screen';

function isPreparation(status?: string) {
  return status === 'preparation' || status === 'preparing';
}

const RallyeIndex = observer(function RallyeIndex() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const rallye = useSelector(() => store$.rallye.get());
  const team = useSelector(() => store$.team.get());
  const idx = useSelector(() => store$.questionIndex.get());
  const qsLen = useSelector(() => store$.questions.get().length);
  const totalQuestions = useSelector(() => store$.totalQuestions.get());
  const answeredCount = useSelector(() => store$.answeredCount.get());
  const showTeamNameSheet = useSelector(() => store$.showTeamNameSheet.get());
  const questions = useSelector(() => store$.questions.get());
  const currentQuestion = useSelector(() => store$.currentQuestion.get());
  const points = useSelector(() => store$.points.get());
  const allQuestionsAnswered = useSelector(() => store$.allQuestionsAnswered.get());
  const timeExpired = useSelector(() => store$.timeExpired.get());

  const loadAnswers = async () => {
    try {
      const { data: joinData, error: joinError } = await supabase
        .from('join_rallye_questions')
        .select('question_id')
        .eq('rallye_id', rallye.id);
      if (joinError) throw joinError;
      const questionIds = (joinData || []).map((row: any) => row.question_id);
      const { data: answers, error: answerError } = await supabase
        .from('answers')
        .select('*')
        .in('question_id', questionIds);
      if (answerError) throw answerError;
      store$.answers.set(answers || []);
    } catch (error) {
      console.error('Error fetching rallye answers:', error);
    }
  };

  const loadQuestions = async () => {
    if (!rallye) return;
    setLoading(true);
    try {
      const { data: joinData, error: joinError } = await supabase
        .from('join_rallye_questions')
        .select('question_id')
        .eq('rallye_id', rallye.id);
      if (joinError) throw joinError;

      const questionIds = (joinData || []).map((row: any) => row.question_id);
      // Track total number of questions for progress display
      store$.totalQuestions.set(questionIds.length);
      if (questionIds.length === 0) {
        store$.questions.set([]);
        store$.currentQuestion.set(null);
        store$.answeredCount.set(0);
        return;
      }

      // already answered for team mode
      let answeredIds: number[] = [];
      if (!rallye.tour_mode && team) {
        const { data: answeredData, error: answeredError } = await supabase
          .from('team_questions')
          .select('question_id')
          .eq('team_id', team.id);
        if (answeredError) throw answeredError;
        answeredIds = (answeredData || []).map((row: any) => row.question_id);
      }
      // Track number of answered questions for progress display
      store$.answeredCount.set(answeredIds.length);

      if (answeredIds.length === questionIds.length && !rallye.tour_mode) {
        store$.allQuestionsAnswered.set(true);
        store$.questionIndex.set(0);
        return;
      }

      const filteredIds = rallye.tour_mode
        ? questionIds
        : questionIds.filter((id: number) => !answeredIds.includes(id));

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', filteredIds);
      if (questionsError) throw questionsError;

      const mapped = (questionsData || []).map((q: any) => ({
        ...q,
        question: q.content,
        question_type: q.type,
      }));

      for (let i = mapped.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
      }

      store$.questions.set(mapped);
      store$.currentQuestion.set(mapped[0] || null);
      store$.questionIndex.set(0);
    } catch (err) {
      console.error('Fehler beim Laden der Fragen:', err);
      Alert.alert(t('common.errorTitle'), t('rallye.error.loadQuestions'));
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    if (!rallye) return;
    setLoading(true);
    // slight delay to avoid flicker
    await new Promise((r) => setTimeout(r, 600));
    try {
      const { data, error } = await supabase
        .from('rallye')
        .select('status, end_time, name')
        .eq('id', rallye.id)
        .single();
      if (error) throw error;
      if (data) {
        store$.rallye.status.set(data.status);
        if (data.end_time) store$.rallye.end_time.set(data.end_time);
        if (data.name) store$.rallye.name.set(data.name);
      }
    } catch (e) {
      console.error('Error fetching rallye status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rallye) return;
    (async () => {
      await loadQuestions();
      await loadAnswers();
      // Ensure we refresh dynamic rallye fields like name/status
      await refreshStatus();
    })();
  }, [rallye?.id, team?.id]);

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

  if (rallye.status === 'post_processing') {
    return <Voting loading={loading} onRefresh={onRefresh} />;
  }

  if (rallye.status === 'ended') {
    return <Scoreboard />;
  }

  if (rallye.status === 'running' && !rallye.tour_mode && !team) {
    return <TeamSetup />;
  }

  if (!allQuestionsAnswered && questions.length === 0) {
    return (
      <>
        <NoQuestions loading={loading} onRefresh={onRefresh} />
        <TeamNameSheet
          visible={!!showTeamNameSheet}
          name={team?.name || ''}
          onClose={() => store$.showTeamNameSheet.set(false)}
        />
      </>
    );
  }

  if (questions.length > 0 && !allQuestionsAnswered) {
    return (
      <>
        <ScreenScrollView
          padding="none"
          contentContainerStyle={[
            globalStyles.default.refreshContainer,
            globalStyles.default.container,
          ]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        >
          <ThemedText variant="bodyStrong" style={{ marginBottom: 8 }}>
            {(rallye?.name ? `${rallye.name} • ` : '') +
              t('rallye.progress', {
                current: rallye?.tour_mode
                  ? idx + 1
                  : Math.min((answeredCount || 0) + 1, totalQuestions || qsLen),
                total: rallye?.tour_mode ? qsLen : totalQuestions || qsLen,
              })}
          </ThemedText>
          <QuestionRenderer question={currentQuestion} />
        </ScreenScrollView>
        <TeamNameSheet
          visible={!!showTeamNameSheet}
          name={team?.name || ''}
          onClose={() => store$.showTeamNameSheet.set(false)}
        />
      </>
    );
  }

  if (allQuestionsAnswered && rallye.tour_mode) {
    // Exploration finished: show simple summary and back to welcome
    return (
      <>
        <ScreenScrollView
          padding="none"
          contentContainerStyle={[
            globalStyles.default.refreshContainer,
            globalStyles.rallyeStatesStyles.container,
          ]}
        >
          <VStack style={{ width: '100%' }} gap={2}>
            <InfoBox mb={2}>
              <ThemedText variant="title" style={globalStyles.rallyeStatesStyles.infoTitle}>
                {t('rallye.allAnswered.title')}
              </ThemedText>
              <ThemedText
                variant="body"
                style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}
              >
                {t('rallye.pointsAchieved', { points })}
              </ThemedText>
            </InfoBox>
            <InfoBox mb={2}>
              <UIButton
                variant="ghost"
                icon="arrow-left"
                onPress={() => {
                  store$.reset();
                  store$.enabled.set(false);
                }}
              >
                {t('rallye.backToStart')}
              </UIButton>
            </InfoBox>
          </VStack>
        </ScreenScrollView>
        <TeamNameSheet
          visible={!!showTeamNameSheet}
          name={team?.name || ''}
          onClose={() => store$.showTeamNameSheet.set(false)}
        />
      </>
    );
  }

  if (allQuestionsAnswered && !rallye.tour_mode) {
    // Time up vs finished before end
    return (
      <>
        <ScreenScrollView
          padding="none"
          contentContainerStyle={[
            globalStyles.default.refreshContainer,
            globalStyles.rallyeStatesStyles.container,
          ]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        >
          <VStack style={{ width: '100%' }} gap={2}>
            <InfoBox mb={2}>
              <ThemedText variant="title" style={globalStyles.rallyeStatesStyles.infoTitle}>
                {timeExpired ? t('rallye.timeUp') : t('rallye.allAnswered.simple')}
              </ThemedText>
              {!timeExpired && team ? (
                <ThemedText
                  variant="body"
                  style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}
                >
                  {t('rallye.teamLabel', { team: team?.name ?? '' })}
                </ThemedText>
              ) : null}
              <ThemedText variant="body" style={globalStyles.rallyeStatesStyles.infoSubtitle}>
                {t('rallye.pointsLabel', { points })}
              </ThemedText>
            </InfoBox>
            <InfoBox>
              <ThemedText variant="body" style={globalStyles.rallyeStatesStyles.meetingPoint}>
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
        <TeamNameSheet
          visible={!!showTeamNameSheet}
          name={team?.name || ''}
          onClose={() => store$.showTeamNameSheet.set(false)}
        />
      </>
    );
  }

  return null;
});

export default RallyeIndex;
