import { useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import UIButton from '@/components/ui/UIButton';
import { supabase } from '@/utils/Supabase';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useTheme } from '@/utils/ThemeContext';
import ThemedText from '@/components/themed/ThemedText';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import { useAppStyles } from '@/utils/AppStyles';
import { Screen } from '@/components/ui/Screen';

export default function Voting({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  const [voting, setVoting] = useState<any[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [counter, setCounter] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  const [sortedContent, setSortedContent] = useState<any[][]>([]);
  const [currentVotingIdx, setCurrentVotingIdx] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any[]>([]);
  const [sendingResult, setSendingResult] = useState(false);
  const rallye = useSelector(() => store$.rallye.get());
  const team = useSelector(() => store$.team.get());
  const votingAllowed = useSelector(() => store$.votingAllowed.get());
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const s = useAppStyles();

  const getVotingData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_voting_content', {
        rallye_id_param: rallye.id,
        own_team_id_param: team.id,
      });
      if (error) throw error;
      setVoting(data || []);
    } catch (e) {
      console.error('Error fetching voting questions:', e);
    }
  };

  const getCount = async () => {
    try {
      const { data: count, error: countError } = await supabase
        .from('voting')
        .select('question_id')
        .eq('rallye_id', rallye.id);
      if (countError) throw countError;
      setCounter((count || []).length);

      const { data, error } = await supabase
        .from('rallye_team')
        .select('id')
        .eq('rallye_id', rallye.id);
      if (error) throw error;
      setTeamCount((data || []).length);
    } catch (e) {
      console.error('Error fetching team count:', e);
    }
  };

  useEffect(() => {
    (async () => {
      await getVotingData();
      await getCount();
    })();
  }, []);

  useEffect(() => {
    const sorted = [...voting].sort((a, b) => a.tq_question_id - b.tq_question_id);
    const grouped: any[][] = [];
    let current: number | null = null;
    for (let i = 0; i < sorted.length; i++) {
      if (current !== sorted[i].tq_question_id) {
        current = sorted[i].tq_question_id;
        grouped.push([]);
      }
      grouped[grouped.length - 1].push(sorted[i]);
    }
    setSortedContent(grouped);

    if (counter > currentVotingIdx) {
      store$.votingAllowed.set(true);
      const currentQ = grouped[currentVotingIdx];
      setCurrentQuestion(currentQ || []);
    } else {
      store$.votingAllowed.set(false);
    }
  }, [currentVotingIdx, counter, voting]);

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
    } finally {
      setSendingResult(false);
    }
  };

  if (!votingAllowed || teamCount < 2) {
    return (
      <Screen padding="none" contentStyle={globalStyles.default.container}>
        <VStack style={{ width: '100%' }} gap={2}>
          <InfoBox mb={2}>
            <ThemedText style={globalStyles.rallyeStatesStyles.infoTitle}>
              Die Abstimmung wurde beendet.
            </ThemedText>
            <ThemedText style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}>
              Wartet auf die Beendigung der Rallye.
            </ThemedText>
          </InfoBox>
          <InfoBox mb={2}>
            <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
              Aktualisieren
            </UIButton>
          </InfoBox>
        </VStack>
      </Screen>
    );
  }

  return (
    <Screen padding="none" contentStyle={[globalStyles.default.container, { flex: 1 }]}>
      <FlatList
        data={currentQuestion}
        keyExtractor={(item) => `${item.tq_team_id}`}
        onRefresh={getVotingData}
        refreshing={loading}
        ListHeaderComponent={() =>
          currentQuestion && currentQuestion.length > 0 ? (
            <View style={{ paddingTop: 10, paddingBottom: 30 }}>
              <InfoBox mb={2}>
                <ThemedText style={globalStyles.rallyeStatesStyles.infoTitle}>
                  {currentQuestion[0]?.question_content}
                </ThemedText>
                <ThemedText style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}>
                  Gebt dem Team einen zusätzlichen Punkt, das eurer Meinung nach
                  die oben gestellte Aufgabe am besten gelöst hat.
                </ThemedText>
              </InfoBox>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
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
                borderColor: selectedTeam === item.rt_id ? Colors.dhbwRed : 'transparent',
                borderWidth: selectedTeam === item.rt_id ? 2 : 0,
              }}
            >
              {item.question_type === 'knowledge' ? (
                <ThemedText style={globalStyles.rallyeStatesStyles.infoTitle}>
                  {item.tq_team_answer}
                </ThemedText>
              ) : (
                (() => {
                  const imageUri = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/upload_photo_answers/${
                    (item?.tq_team_answer || '').trim()
                  }`;
                  return (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: '100%', height: 200, resizeMode: 'contain', marginBottom: 10 }}
                    />
                  );
                })()
              )}
              <ThemedText style={globalStyles.rallyeStatesStyles.infoSubtitle}>
                {item.rt_team_name}
              </ThemedText>
            </InfoBox>
          </TouchableOpacity>
        )}
        contentContainerStyle={[{ padding: 10 }]}
      />
      <View style={{ padding: 10 }}>
        <InfoBox mb={2}>
          <UIButton disabled={!selectedTeam || sendingResult} onPress={handleNextQuestion}>
            Nächste Abstimmung
          </UIButton>
        </InfoBox>
      </View>
    </Screen>
  );
}
