import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { supabase } from '../utils/Supabase';
import { useSharedStates } from '../utils/SharedStates';
import { getData, storeData } from '../utils/LocalStorage';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/Styles';
import Colors from '../utils/Colors';

export default function TeamScreen() {
  const {
    teams,
    setTeams,
    team,
    setTeam,
    rallye,
    useRallye,
    setEnabled,
  } = useSharedStates();
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!useRallye) {
      return;
    }
    onRefresh();
    const fetchLocalStorage = async () => {
      const teamId = await getData('team_key');
      if (teamId !== null) {
        setTeam(teamId);
      }
    };
    fetchLocalStorage();
  }, []);

  const onRefresh = async () => {
    setLoading(true);
    const { data: groups } = await supabase
      .from('rallye_group')
      .select('*')
      .eq('rallye_id', rallye.id)
      .order('id', { ascending: false });
    setTeams(groups);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color={Colors.dhbwRed} />
      </View>
    );
  }

  if (!useRallye) {
    return (
      <View style={globalStyles.container}>
        <Text style={[globalStyles.bigText, { marginBottom: 10 }]}>
          Es ist aktuell keine Rallye aktiv.
        </Text>
        <UIButton icon="arrow-left" onPress={() => setEnabled(false)}>
          Zurück zur Anmeldung
        </UIButton>
      </View>
    );
  }

  const renameTeam = async (teamId) => {
    if (newTeamName !== '') {
      setLoading(true);
      await supabase
        .from('rallye_group')
        .update({ name: newTeamName })
        .eq('id', teamId);
      setNewTeamName('');
      onRefresh();
      setLoading(false);
    }
  };

  const chooseTeam = async (teamId) => {
    setTeam(teamId);
    await supabase
      .from('rallye_group')
      .update({ used: true })
      .eq('id', teamId);
    await storeData('team_key', teamId);
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 10 }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      {teams?.map((item, index) => (
        <View
          key={index}
          style={[
            globalStyles.section,
            {
              borderColor:
                item.id === team ? Colors.dhbwRed : 'white',
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  item.id === team ? Colors.dhbwRed : Colors.dhbwGray,
              },
            ]}
          >
            Team {index + 1}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name des Teams:</Text>
            <Text style={styles.value}>{item.name}</Text>
          </View>
          {item.id === team && (
            <>
              <TextInput
                style={styles.input}
                onChangeText={setNewTeamName}
                value={newTeamName}
                placeholder="Neuer Name für das Team"
              />
              <UIButton
                onPress={() => renameTeam(item.id)}
                disabled={!newTeamName}
              >
                Namen des Teams ändern
              </UIButton>
            </>
          )}

          {!team && !item.used && (
            <UIButton
              outline={true}
              onPress={() => chooseTeam(item.id)}
            >
              Auswählen
            </UIButton>
          )}

          {!team && item.used && (
            <UIButton
              outline={false}
              disabled={true}
              onPress={() => null}
            >
              Team bereits vergeben
            </UIButton>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: Colors.dhbwGray,
    marginRight: 5,
  },
  value: {
    fontSize: 16,
    color: Colors.dhbwGray,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: Colors.dhbwGray,
    borderRadius: 5,
    borderWidth: 1,
    width: '100%',
    padding: 10,
    marginBottom: 10,
  },
});
