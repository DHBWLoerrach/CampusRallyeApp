import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, TouchableOpacity, View } from 'react-native';
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
  const s = useAppStyles();
  const { t } = useLanguage();
  const rallyeId = rallye?.id;
  const teamId = team?.id;

  const getVotingData = useCallback(async () => {
    if (!rallyeId || !teamId) return;
    try {
      const { data, error } = await supabase.rpc('get_voting_content', {
        rallye_id_param: rallyeId,
        own_team_id_param: teamId,
      });
      if (error) throw error;
      setVoting(data || []);
    } catch (e) {
      console.error('Error fetching voting questions:', e);
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
    } catch (e) {
      console.error('Error fetching team count:', e);
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
      console.error('Error updating team question:', e);
      Alert.alert(t('common.errorTitle'), t('voting.error.submit'));
    } finally {
      setSendingResult(false);
    }
  };

  if (!votingAllowed || teamCount < 2) {
    return (
      <Screen padding="none" contentStyle={globalStyles.default.container}>
        <VStack style={{ width: '100%' }} gap={2}>
          <InfoBox mb={2}>
            <ThemedText
              variant="title"
              style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
            >
              {t('voting.ended.title')}
            </ThemedText>
            <ThemedText
              variant="body"
              style={[
                globalStyles.rallyeStatesStyles.infoSubtitle,
                s.muted,
                { marginTop: 10 },
              ]}
            >
              {t('voting.ended.message')}
            </ThemedText>
          </InfoBox>
          <InfoBox mb={2}>
            <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
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
        data={currentQuestion}
        keyExtractor={(item) => `${item.tq_team_id}`}
        onRefresh={getVotingData}
        refreshing={loading}
        ListHeaderComponent={() =>
          currentQuestion && currentQuestion.length > 0 ? (
            <View style={{ paddingTop: 10, paddingBottom: 30 }}>
              <InfoBox mb={2}>
                <ThemedText
                  variant="title"
                  style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
                >
                  {currentQuestion[0]?.question_content}
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
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`vote-option-${item.tq_id}`}
            onPress={() => {
              setSelectedTeam(item.rt_id);
              setSelectedUpdateId(item.tq_id);
            }}
            activeOpacity={1.0}
            style={{ alignItems: 'flex-start', paddingTop: 10 }}
          >
            <InfoBox
              mb={2}
              style={{
                borderColor:
                  selectedTeam === item.rt_id ? Colors.dhbwRed : 'transparent',
                borderWidth: selectedTeam === item.rt_id ? 2 : 0,
              }}
            >
              {item.question_type === 'knowledge' ? (
                <ThemedText
                  variant="title"
                  style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
                >
                  {item.tq_team_answer}
                </ThemedText>
              ) : (
                (() => {
                  const imageUri = `${
                    process.env.EXPO_PUBLIC_SUPABASE_URL
                  }/storage/v1/object/public/upload_photo_answers/${(
                    item?.tq_team_answer || ''
                  ).trim()}`;
                  return (
                    <Image
                      source={{ uri: imageUri }}
                      style={{
                        width: '100%',
                        height: 200,
                        resizeMode: 'contain',
                        marginBottom: 10,
                      }}
                    />
                  );
                })()
              )}
              <ThemedText
                variant="body"
                style={[globalStyles.rallyeStatesStyles.infoSubtitle, s.muted]}
              >
                {item.rt_team_name}
              </ThemedText>
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
