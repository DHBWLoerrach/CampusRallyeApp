import React, { useEffect, useState, useMemo } from 'react';
import { Alert, RefreshControl, Text, View } from 'react-native';
import { observer, useSelector } from '@legendapp/state/react';
import NetInfo from '@react-native-community/netinfo';
import { store$ } from '@/services/storage/Store';
import { supabase } from '@/utils/Supabase';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import Preparation from '@/app/(tabs)/rallye/states/Preparation';
import NoQuestions from '@/app/(tabs)/rallye/states/NoQuestions';
import TeamSetup from '@/app/(tabs)/rallye/team-setup';
import Voting from '@/app/(tabs)/rallye/voting';
import Scoreboard from '@/app/(tabs)/rallye/scoreboard';
import QuestionRenderer from '@/app/(tabs)/rallye/question-renderer';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import ThemedView from '@/components/themed/ThemedView';
import { useAppStyles } from '@/utils/AppStyles';
import { useTheme } from '@/utils/ThemeContext';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import TeamNameSheet from '@/components/ui/TeamNameSheet';

function isPreparation(status?: string) {
  return status === 'preparation' || status === 'preparing';
}

const RallyeIndex = observer(function RallyeIndex() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const s = useAppStyles();

  const rallye = useSelector(() => store$.rallye.get());
  const team = useSelector(() => store$.team.get());
  const idx = useSelector(() => store$.questionIndex.get());
  const qsLen = useSelector(() => store$.questions.get().length);
  const totalQuestions = useSelector(() => (store$ as any).totalQuestions.get());
  const answeredCount = useSelector(() => (store$ as any).answeredCount.get());
  const showTeamNameSheet = useSelector(() => (store$ as any).showTeamNameSheet.get());
  const questions = useSelector(() => store$.questions.get());
  const currentQuestion = useSelector(() => store$.currentQuestion.get());
  const points = useSelector(() => store$.points.get());
  const allQuestionsAnswered = useSelector(() => store$.allQuestionsAnswered.get());
  const timeExpired = useSelector(() => store$.timeExpired.get());

  const bgColor = useMemo(() => ({}), []);

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
      (store$ as any).totalQuestions.set(questionIds.length);
      if (questionIds.length === 0) {
        store$.questions.set([]);
        store$.currentQuestion.set(null);
        (store$ as any).answeredCount.set(0);
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
      (store$ as any).answeredCount.set(answeredIds.length);

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
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Die Fragen konnten nicht geladen werden.'
          : 'The questions could not be loaded.'
      );
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
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Keine Internetverbindung verfügbar'
          : 'No internet connection available'
      );
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

  // Running flow handlers
  const handleAnswer = async (answeredCorrectly: boolean, answerPoints: number) => {
    try {
      if (answeredCorrectly) store$.points.set(points + answerPoints);
      if (team && currentQuestion) {
        const { error } = await supabase.from('team_questions').insert({
          team_id: team.id,
          question_id: currentQuestion.id,
          correct: answeredCorrectly,
          points: answeredCorrectly ? answerPoints : 0,
        });
        if (error) throw error;
      }
      store$.gotoNextQuestion();
    } catch (e) {
      console.error('Fehler beim Speichern der Antwort:', e);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Antwort konnte nicht gespeichert werden.'
          : 'Answer could not be saved.'
      );
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
          onClose={() => (store$ as any).showTeamNameSheet.set(false)}
        />
      </>
    );
  }

  if (questions.length > 0 && !allQuestionsAnswered) {
    return (
      <>
        <ThemedScrollView
          variant="background"
          contentContainerStyle={[globalStyles.default.refreshContainer]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        >
          <ThemedView variant="background" style={globalStyles.default.container}>
          <ThemedText style={{ fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
              {(rallye?.name ? `${rallye.name} • ` : '') +
                (language === 'de'
                  ? `Frage ${
                      (rallye?.tour_mode
                        ? idx + 1
                        : Math.min((answeredCount || 0) + 1, totalQuestions || qsLen))
                    } von ${rallye?.tour_mode ? qsLen : totalQuestions || qsLen}`
                  : `Question ${
                      (rallye?.tour_mode
                        ? idx + 1
                        : Math.min((answeredCount || 0) + 1, totalQuestions || qsLen))
                    } of ${rallye?.tour_mode ? qsLen : totalQuestions || qsLen}`)}
            </ThemedText>
            <QuestionRenderer question={currentQuestion} onAnswer={handleAnswer} />
          </ThemedView>
        </ThemedScrollView>
        <TeamNameSheet
          visible={!!showTeamNameSheet}
          name={team?.name || ''}
          onClose={() => (store$ as any).showTeamNameSheet.set(false)}
        />
      </>
    );
  }

  if (allQuestionsAnswered && rallye.tour_mode) {
    // Exploration finished: show simple summary and back to welcome
    return (
      <>
        <ThemedScrollView variant="background" contentContainerStyle={[globalStyles.default.refreshContainer]}>
          <VStack style={{ width: '100%' }} gap={2}>
            <InfoBox mb={2}>
              <ThemedText style={globalStyles.rallyeStatesStyles.infoTitle}>
                {language === 'de' ? 'Alle Fragen beantwortet.' : 'All questions answered.'}
              </ThemedText>
              <ThemedText style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}>
                {language === 'de' ? 'Erreichte Punkte: ' : 'Points achieved: '} {points}
              </ThemedText>
            </InfoBox>
            <InfoBox mb={2}>
              <Text
                onPress={() => {
                  store$.reset();
                  store$.enabled.set(false);
                }}
                style={{ color: Colors.dhbwRed, fontWeight: '600', textAlign: 'center' }}
              >
                {language === 'de' ? 'Zurück zum Start' : 'Back to start'}
              </Text>
            </InfoBox>
          </VStack>
        </ThemedScrollView>
        <TeamNameSheet
          visible={!!showTeamNameSheet}
          name={team?.name || ''}
          onClose={() => (store$ as any).showTeamNameSheet.set(false)}
        />
      </>
    );
  }

  if (allQuestionsAnswered && !rallye.tour_mode) {
    // Time up vs finished before end
    return (
      <>
        <ThemedScrollView
          variant="background"
          contentContainerStyle={[globalStyles.default.refreshContainer]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        >
          <VStack style={{ width: '100%' }} gap={2}>
            <InfoBox mb={2}>
              <ThemedText style={globalStyles.rallyeStatesStyles.infoTitle}>
                {timeExpired
                  ? language === 'de' ? 'Zeit abgelaufen!' : 'Time up!'
                  : language === 'de' ? 'Alle Fragen beantwortet' : 'All questions answered'}
              </ThemedText>
              {!timeExpired && team ? (
                <ThemedText style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}>
                  {language === 'de' ? 'Team: ' : 'Team: '} {team?.name}
                </ThemedText>
              ) : null}
              <ThemedText style={globalStyles.rallyeStatesStyles.infoSubtitle}>
                {language === 'de' ? 'Punkte: ' : 'Points: '} {points}
              </ThemedText>
            </InfoBox>
            <InfoBox>
              <ThemedText style={globalStyles.rallyeStatesStyles.meetingPoint}>
                {language === 'de' ? 'Bitte kommt zum vereinbarten Treffpunkt' : 'Please come to the agreed meeting point.'}
              </ThemedText>
            </InfoBox>
            <InfoBox mb={2}>
              <Text style={{ color: Colors.dhbwRed, textAlign: 'center' }} onPress={onRefresh}>
                {language === 'de' ? 'Aktualisieren' : 'Refresh'}
              </Text>
            </InfoBox>
          </VStack>
        </ThemedScrollView>
        <TeamNameSheet
          visible={!!showTeamNameSheet}
          name={team?.name || ''}
          onClose={() => (store$ as any).showTeamNameSheet.set(false)}
        />
      </>
    );
  }

  return null;
});

export default RallyeIndex;
