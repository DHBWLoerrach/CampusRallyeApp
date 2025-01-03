import { useState, useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { store$ } from '../utils/Store';
import { supabase } from '../utils/Supabase';
import { globalStyles } from '../utils/GlobalStyles';
import UIButton from '../ui/UIButton';

export default function ScoreboardScreen() {
  const rallye = store$.rallye.get();
  const ourTeam = store$.team.get();
  const points = store$.points.get();
  const [sortedTeams, setSortedTeams] = useState([]);

  useEffect(() => {
    if (rallye.status !== 'ended') return;
    const fetchData = async () => { 
      try {
        let { data } = await supabase.rpc(
          'get_total_points_per_rallye',
          { rallye_id_param: rallye.id }
        );

        if (data) {
          data.sort((a, b) => b.total_points - a.total_points);

          // compute ranking and respect ties
          let rank = 1;
          let previousPoints = data[0].total_points;

          const rankedData = data.map((team) => {
            if (previousPoints !== team.total_points) rank += 1;
            previousPoints = team.total_points;
            return { ...team, rank: rank };
          });

          setSortedTeams(rankedData);
        }
      } catch (error) {
        console.error('Error fetching total points data:', error);
      }
    };

    fetchData();
  }, [rallye]);

  return (
    <>
    <ScrollView style={globalStyles.scoreboardStyles.container}>
      <Text style={globalStyles.scoreboardStyles.title}>
        Punktestand
      </Text>
      {ourTeam && (
        <Text style={globalStyles.scoreboardStyles.teamInfo}>
          {ourTeam.name}: {points} Punkte
        </Text>
      )}
      <View style={globalStyles.scoreboardStyles.tableHeader}>
        <Text style={globalStyles.scoreboardStyles.headerText}>Platz</Text>
        <Text style={globalStyles.scoreboardStyles.headerText}>Team</Text>
        <Text style={globalStyles.scoreboardStyles.headerText}>Punkte</Text>
      </View>
      {sortedTeams.map((team, index) => (
        <View
          key={index}
          style={[
            globalStyles.scoreboardStyles.tableRow,
            team.group_name === ourTeam?.name && globalStyles.scoreboardStyles.ourTeam,
          ]}
        >
          <Text style={globalStyles.scoreboardStyles.rowText}>{team.rank}</Text>
          <Text style={globalStyles.scoreboardStyles.rowText}>{team.group_name}</Text>
          <Text style={globalStyles.scoreboardStyles.rowText}>{team.total_points}</Text>
        </View>
      ))}
    </ScrollView>
    <UIButton icon="arrow-left" onPress={() => store$.enabled.set(false)}>
        Zurück zur Anmeldung
    </UIButton>
    </>
  );
}