import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { store$ } from '../utils/Store';
import { supabase } from '../utils/Supabase';
import Colors from '../utils/Colors';

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
    <ScrollView style={styles.container}>
      <Text style={styles.scoreboardTitle}>Rangliste</Text>
      {ourTeam && (
        <Text style={[styles.headerText, { marginBottom: 10 }]}>
          {ourTeam.name}: {points} Punkte
        </Text>
      )}
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Platz</Text>
        <Text style={styles.headerText}>Team</Text>
        <Text style={styles.headerText}>Punkte</Text>
      </View>
      {sortedTeams.map((team, index) => (
        <View
          key={index}
          style={[
            styles.tableRow,
            team.group_name === ourTeam?.name && styles.ourTeam,
          ]}
        >
          <Text style={styles.rowText}>{team.rank}</Text>
          <Text style={styles.rowText}>{team.group_name}</Text>
          <Text style={styles.rowText}>{team.total_points}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  scoreboardTitle: {
    color: Colors.dhbwGray,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tableHeader: {
    color: Colors.dhbwGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  headerText: {
    color: Colors.dhbwGray,
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  rowText: {
    color: Colors.dhbwGray,
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  ourTeam: {
    backgroundColor: Colors.veryLightGray,
    borderRadius: 8,
  },
});
