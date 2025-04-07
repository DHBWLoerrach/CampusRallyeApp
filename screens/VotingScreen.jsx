import { useState, useEffect } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { store$ } from '../services/storage/Store';
import UIButton from '../ui/UIButton';
import { supabase } from '../utils/Supabase';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/GlobalStyles';

export default function VotingScreen({ onRefresh, loading }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [voting, setVoting] = useState([]);
  const [teamCount, setTeamCount] = useState(0);
  const [counter, setCounter] = useState(0);
  const [selectedUpdateId, setSelectedUpdateId] = useState(null);
  const [sortedContent, setSortedContent] = useState([]);
  const [currentVotingIdx, setCurrentVotingIdx] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sendingResult, setSendingResult] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const votingAllowed = store$.votingAllowed.get();

  const getVotingData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_voting_content', {
        rallye_id_param: rallye.id,
        own_team_id_param: team.id,
      });
      if (error) {
        throw error;
      }
      setVoting(data || []);
    } catch (error) {
      console.error('Error fetching voting questions:', error);
    }
  };

  const getCount = async () => {
    try {
      const { data: count, error: countError } = await supabase
        .from('voting')
        .select('question_id')
        .eq('rallye_id', rallye.id);
      if (countError) {
        console.error('Error fetching voting questions:', countError);
        return;
      }
      setCounter(count.length);

      const { data, error } = await supabase
        .from('rallye_team')
        .select('id')
        .eq('rallye_id', rallye.id);
      if (error) {
        console.error('Error fetching team count:', error);
        return;
      }
      setTeamCount(data.length);
    } catch (error) {
      console.error('Error fetching team count:', error);
    }
  };

  useEffect(() => {
    (async () => {
      await getVotingData();
      await getCount();
    })();
  }, []);

  useEffect(() => {
    const sorted = voting.sort((a, b) => a.tq_question_id - b.tq_question_id);

    let result = [];
    let current = null;
    for (let i = 0; i < sorted.length; i++) {
      if (current !== sorted[i].tq_question_id) {
        current = sorted[i].tq_question_id;
        result.push([]);
      }
      result[result.length - 1].push(sorted[i]);
    }
    setSortedContent(result);

    if (counter > currentVotingIdx) {
      store$.votingAllowed.set(true);
      const currentQ = sortedContent[currentVotingIdx];
      setCurrentQuestion(currentQ);
    } else {
      store$.votingAllowed.set(false);
    }
  }, [currentVotingIdx, counter, voting]);

  const handleNextQuestion = async () => {
    // Update der Punkte
    const { data, error } = await supabase.rpc(
      'increment_team_question_points',
      {
        target_answer_id: selectedUpdateId,
      }
    );
    if (error) {
      console.error('Error updating team question:', error);
      return;
    }

    setCurrentVotingIdx(currentVotingIdx + 1);
    setSelectedUpdateId(null);
    setSelectedTeam(null);
    setSendingResult(false);
  };

  if (!votingAllowed || teamCount < 2) {
    return (
      <View
        style={[globalStyles.default.container, { backgroundColor: 'white' }]}
      >
        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
            Die Abstimmung wurde beendet wurde.
          </Text>
          <Text
            style={[
              globalStyles.rallyeStatesStyles.infoSubtitle,
              { marginTop: 10 },
            ]}
          >
            Wartet auf die Beendigung der Rallye.
          </Text>
        </View>
        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
            Aktualisieren
          </UIButton>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        globalStyles.default.container,
        { backgroundColor: 'white', flex: 1 },
      ]}
    >
      <FlatList
        data={currentQuestion}
        keyExtractor={(item) => item.tq_team_id}
        onRefresh={getVotingData}
        refreshing={loading}
        ListHeaderComponent={() =>
          currentQuestion && currentQuestion.length > 0 ? (
            <View style={{ paddingTop: 10, paddingBottom: 30 }}>
              <View style={globalStyles.rallyeStatesStyles.infoBox}>
                <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
                  {currentQuestion[0]?.question_content}
                </Text>
                <Text
                  style={[
                    globalStyles.rallyeStatesStyles.infoSubtitle,
                    { marginTop: 10 },
                  ]}
                >
                  Gebt dem Team einen zusätzlichen Punkt, das eurer Meinung nach
                  die oben gestellte Aufgabe am besten gelöst hat.
                </Text>
              </View>
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
            <View
              style={[
                globalStyles.rallyeStatesStyles.infoBox,
                {
                  borderColor:
                    selectedTeam === item.rt_id
                      ? Colors.dhbwRed
                      : 'transparent',
                  borderWidth: selectedTeam === item.rt_id ? 2 : 0,
                },
              ]}
            >
              {item.question_type === 'knowledge' ? (
                <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
                  {item.tq_team_answer}
                </Text>
              ) : (
                (() => {
                  const imageUri = `${
                    process.env.EXPO_PUBLIC_SUPABASE_URL
                  }/storage/v1/object/public/upload_photo_answers/${item?.tq_team_answer.trim()}`;
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
              <Text style={globalStyles.rallyeStatesStyles.infoSubtitle}>
                {item.rt_team_name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={[{ padding: 10 }]}
      />
      <View
        style={{
          padding: 10,
        }}
      >
        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <UIButton
            disabled={!selectedTeam || sendingResult}
            onPress={handleNextQuestion}
          >
            Nächste Abstimmung
          </UIButton>
        </View>
      </View>
    </View>
  );
}
