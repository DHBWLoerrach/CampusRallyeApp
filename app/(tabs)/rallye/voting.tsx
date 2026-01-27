import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, TouchableOpacity, View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import UIButton from '@/components/ui/UIButton';
import { supabase } from '@/utils/Supabase';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedText from '@/components/themed/ThemedText';
import InfoBox from '@/components/ui/InfoBox';
import { Screen } from '@/components/ui/Screen';

export default function Voting({
  onRefresh,
  loading,
}: {
  onRefresh: () => void;
  loading: boolean;
}) {
  const [voting, setVoting] = useState<any[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [counter, setCounter] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  const [currentVotingIdx, setCurrentVotingIdx] = useState(0);
  const [sendingResult, setSendingResult] = useState(false);
  const rallye = useSelector(() => store$.rallye.get());
  const team = useSelector(() => store$.team.get());
  const votingAllowed = useSelector(() => store$.votingAllowed.get());
  const { t } = useLanguage();
  const rallyeId = rallye?.id;
  const teamId = team?.id;

  const getVotingData = useCallback(async () => {
    if (!rallyeId || !teamId) {
      return;
    }
    try {
      // Get voting questions with question details
      const { data: votingQuestions, error: votingError } = await supabase
        .from('voting')
        .select('question_id, questions(id, content, type)')
        .eq('rallye_id', rallyeId);

      if (votingError) throw votingError;
      if (!votingQuestions || votingQuestions.length === 0) {
        setVoting([]);
        return;
      }

      // Get all teams in this rallye except own team
      const { data: teams, error: teamsError } = await supabase
        .from('rallye_team')
        .select('id, name')
        .eq('rallye_id', rallyeId)
        .neq('id', teamId);

      if (teamsError) throw teamsError;
      if (!teams || teams.length === 0) {
        setVoting([]);
        return;
      }

      // Build voting data structure
      const votingData: any[] = [];
      for (const vq of votingQuestions) {
        const question = vq.questions as any;
        if (!question) {
          continue;
        }

        for (const team of teams) {
          const { data: tqData, error: tqError } = await supabase
            .from('team_questions')
            .select('id, team_answer')
            .eq('team_id', team.id)
            .eq('question_id', question.id)
            .maybeSingle();

          if (tqError && tqError.code !== 'PGRST116') throw tqError;

          let tqId = tqData?.id;
          let teamAnswer = tqData?.team_answer;

          if (!tqId) {
            const { data: newTq, error: insertError } = await supabase
              .from('team_questions')
              .insert({
                team_id: team.id,
                question_id: question.id,
                team_answer: null,
                points: 0,
                correct: false,
              })
              .select('id, team_answer')
              .single();

            if (insertError) throw insertError;
            tqId = newTq.id;
            teamAnswer = newTq.team_answer;
          }

          votingData.push({
            tq_question_id: question.id,
            question_content: question.content,
            rt_id: team.id,
            rt_team_name: team.name,
            tq_id: tqId,
            tq_team_answer: teamAnswer,
          });
        }
      }

      setVoting(votingData);
    } catch {
      setVoting([]);
    }
  }, [rallyeId, teamId]);

  const getCount = useCallback(async () => {
    if (!rallyeId) return;
    try {
      const { data: count, error: countError } = await supabase
        .from('voting')
        .select('question_id')
        .eq('rallye_id', rallyeId);
      if (countError) throw countError;
      setCounter((count || []).length);

      const { data, error } = await supabase
        .from('rallye_team')
        .select('id')
        .eq('rallye_id', rallyeId);
      if (error) throw error;
      setTeamCount((data || []).length);
    } catch {
      setCounter(0);
      setTeamCount(0);
    }
  }, [rallyeId]);

  useEffect(() => {
    (async () => {
      await getVotingData();
      await getCount();
    })();
  }, [getCount, getVotingData]);

  const groupedQuestions = useMemo(() => {
    const sorted = [...voting].sort(
      (a, b) => a.tq_question_id - b.tq_question_id
    );
    const grouped: any[][] = [];
    let current: number | null = null;
    for (let i = 0; i < sorted.length; i++) {
      if (current !== sorted[i].tq_question_id) {
        current = sorted[i].tq_question_id;
        grouped.push([]);
      }
      grouped[grouped.length - 1].push(sorted[i]);
    }
    return grouped;
  }, [voting]);

  const currentQuestion = useMemo(
    () => groupedQuestions[currentVotingIdx] || [],
    [currentVotingIdx, groupedQuestions]
  );

  useEffect(() => {
    store$.votingAllowed.set(counter > currentVotingIdx);
  }, [counter, currentVotingIdx]);

  const handleNextQuestion = async () => {
    try {
      if (!selectedUpdateId) return;
      setSendingResult(true);
      const { error } = await supabase.rpc('increment_team_question_points', {
        target_answer_id: selectedUpdateId,
      });
      if (error) throw error;
      setCurrentVotingIdx((i) => i + 1);
      setSelectedUpdateId(null);
      setSelectedTeam(null);
    } catch (e) {
      Alert.alert(t('common.errorTitle'), t('voting.error.submit'));
    } finally {
      setSendingResult(false);
    }
  };

  if (!votingAllowed || teamCount < 2) {
    return (
      <Screen padding="none">
        <>
          <InfoBox>
            <ThemedText variant="title">
              {t('voting.ended.title')}
            </ThemedText>
            <ThemedText variant="body">
              {t('voting.ended.message')}
            </ThemedText>
          </InfoBox>
          <InfoBox>
            <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
              {t('common.refresh')}
            </UIButton>
          </InfoBox>
        </>
      </Screen>
    );
  }

  return (
    <Screen padding="none" edges={['bottom']}>
      <FlatList
        data={currentQuestion}
        keyExtractor={(item) => `${item.tq_id}`}
        onRefresh={getVotingData}
        refreshing={loading}
        ListHeaderComponent={
          currentQuestion.length > 0 ? (
            <InfoBox>
              <ThemedText variant="title">
                {currentQuestion[0].question_content}
              </ThemedText>
            </InfoBox>
          ) : undefined
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`vote-option-${item.tq_id}`}
            onPress={() => {
              if (selectedTeam === item.rt_id) {
                setSelectedTeam(null);
                setSelectedUpdateId(null);
              } else {
                setSelectedTeam(item.rt_id);
                setSelectedUpdateId(item.tq_id);
              }
            }}
          >
              <InfoBox>
                <ThemedText variant="title">
                  {item.tq_team_answer}
                </ThemedText>
                <ThemedText variant="body">
                  {item.rt_team_name}
                </ThemedText>
              </InfoBox>
            </TouchableOpacity>
        )}
      />
      <InfoBox>
        <UIButton
          disabled={!selectedTeam || sendingResult}
          onPress={handleNextQuestion}
        >
          {t('voting.next')}
        </UIButton>
      </InfoBox>
    </Screen>
  );
}
