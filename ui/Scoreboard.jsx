import { View, Text, StyleSheet } from 'react-native';
import { useSharedStates } from '../utils/SharedStates';
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/Supabase';




const Scoreboard = () => {

  const {
    questions,
    setQuestions,
    currentQuestion,
    group,
    points,
    useRallye,
    rallye,
    setRallye,
    setPoints,
  } = useSharedStates();

  const [sortedGroups, setSortedGroups] = useState([]);

   //Total Points
   useEffect(() => {
    if(rallye.status === "ended"){ 
    const fetchData = async () => {
      try {
        let rallye_id_param = rallye.id;
        let { data, error } = await supabase.rpc('get_total_points_per_rallye', {
          rallye_id_param,
        });

        if (data) {
          data.sort((a, b) => b.total_points - a.total_points);
          setSortedGroups(data);
        }
      } catch (error) {
        console.error('Error fetching total points data:', error);
      }
    };
      
  fetchData();
    }
}, []);

  return (
    <View style={styles.scoreboardContainer}>
      <Text style={styles.scoreboardTitle}>Scoreboard</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Platz</Text>
        <Text style={styles.headerText}>Gruppen Name</Text>
        <Text style={styles.headerText}>Erreichte Punkte</Text>
      </View>
      {sortedGroups.map((group, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={styles.rowText}>{index + 1}</Text>
          <Text style={styles.rowText}>{group.group_name}</Text>
          <Text style={styles.rowText}>{group.total_points}</Text>
        </View>
      ))}
    </View>
  );
}; 

const styles = StyleSheet.create({
  scoreboardContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',

  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  headerText: {
    fontSize: 18,
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
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
});

export default Scoreboard;