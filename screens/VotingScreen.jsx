import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { store$ } from '../utils/Store';
import { supabase } from '../utils/Supabase';
import UIButton from '../ui/UIButton';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/Styles';

export default function VotingScreen() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [voting, setVoting] = useState([]);
  const [currentVoting, setCurrentVoting] = useState(0);
  const [sendingResult, setSendingResult] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();

  useEffect(() => {
    const fetchDataSupabase = async () => {
      const { data: teams } = await supabase
        .from('rallye_group')
        .select('*')
        .eq('rallye_id', rallye.id)
        .order('id', { ascending: false });
      setTeams(teams);
      const { data: vote } = await supabase.rpc(
        'get_unvoted_questions',
        {
          input_group_id: team.id,
        }
      );
      if (vote !== null) {
        setVoting(vote);
      }
    };
    fetchDataSupabase();
  }, []);

  const handleNextQuestion = async () => {
    setSendingResult(true);
    await supabase.from('question_voting').insert([
      {
        question_id: voting[currentVoting]?.id,
        group_id: team.id,
        voted_group_id: selectedTeam,
      },
    ]);
    setCurrentVoting(currentVoting + 1);
    setSelectedTeam(null);
    setSendingResult(false);
  };

  if (teams.length < 2 || !voting[currentVoting]) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.bigText}>
          Die Abstimmung wurde beendet.
        </Text>
        <Text style={globalStyles.bigText}>
          Lade diese Seite neu, um das Ergebnis zu sehen, nachdem die
          Rallye beendet wurde.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.main}>
      <Text style={[styles.text, { fontStyle: 'italic' }]}>
        {voting[currentVoting]?.question}
      </Text>
      <Text
        style={[
          styles.text,
          {
            margin: 20,
            color: Colors.dhbwRed,
          },
        ]}
      >
        Gebt dem Team einen zusätzlichen Punkt, das eurer Meinung nach
        die oben gestellte Aufgabe am besten gelöst hat.
      </Text>
      {teams
        ?.filter((item) => item.id !== team.id)
        .map((item, index) => (
          <View
            key={index}
            style={[
              globalStyles.section,
              {
                borderColor:
                  selectedTeam === item.id ? Colors.dhbwRed : 'white',
              },
            ]}
          >
            <View style={styles.row}>
              <Text style={styles.label}>Name des Teams:</Text>
              <Text style={styles.value}>{item.name}</Text>
            </View>
            <UIButton
              color={Colors.dhbwGray}
              outline={true}
              onPress={() => setSelectedTeam(item.id)}
            >
              Punkt vergeben
            </UIButton>
          </View>
        ))}
      <UIButton
        color={selectedTeam ? Colors.dhbwRed : Colors.dhbwLightGray}
        disabled={!selectedTeam || sendingResult}
        onPress={handleNextQuestion}
      >
        Nächste Abstimmung
      </UIButton>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    padding: 20,
  },
  text: {
    fontSize: 20,
    color: Colors.dhbwGray,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: Colors.dhbwGray,
    marginRight: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
