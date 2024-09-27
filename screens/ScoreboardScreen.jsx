import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { store$ } from '../utils/Store';
import { supabase } from '../utils/Supabase';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/Styles';

export default function ScoreboardScreen() {
  const rallye = store$.rallye.get();
  const [sortedTeams, setSortedTeams] = useState([]);

  useEffect(() => {
    if (rallye.status !== 'ended') {
      return;
    }
    const fetchData = async () => {
      try {
        let rallye_id_param = rallye.id;
        let { data } = await supabase.rpc(
          'get_total_points_per_rallye',
          {
            rallye_id_param,
          }
        );

        if (data) {
          data.sort((a, b) => b.total_points - a.total_points);
          setSortedTeams(data);
        }
      } catch (error) {
        console.error('Error fetching total points data:', error);
      }
    };

    fetchData();
  }, [rallye]);

  return (
    <View style={globalStyles.container}>
      <Text style={styles.scoreboardTitle}>Rangliste</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Platz</Text>
        <Text style={styles.headerText}>Team</Text>
        <Text style={styles.headerText}>Punkte</Text>
      </View>
      {sortedTeams.map((team, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={styles.rowText}>{index + 1}</Text>
          <Text style={styles.rowText}>{team.group_name}</Text>
          <Text style={styles.rowText}>{team.total_points}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  rowText: {
    color: Colors.dhbwGray,
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
});
