import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Button,
  Platform,
} from 'react-native';
import UIButton from '../ui/UIButton';
import { useSharedStates } from '../utils/SharedStates';
import Colors from '../utils/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/Supabase';
import { getData, storeData } from '../utils/LocalStorage';

//todo:potenzielles Problem bei der Gruppen auswahl welches durch Signal R oder Refresh gelöst werden muss

export default function GroupScreen() {
  const {
    groups,
    setGroups,
    group,
    setGroup,
    questions,
    currentQuestion,
    points,
    rallye,
    useRallye,
    setEnabled,
  } = useSharedStates();
  const [loading, setLoading] = useState(true);
  const [selectionMade, setSelectionMade] = useState(false);

  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (!useRallye) {
      return;
    }
    const fetchDataSupabase = async () => {
      const { data: groups } = await supabase
        .from('rallye_group')
        .select('*')
        .eq('rallye_id', rallye.id)
        .order('id', { ascending: false });
      setGroups(groups);
      setLoading(false);
    };
    fetchDataSupabase();

    const fetchLocalStorage = async () => {
      groupId = await getData('group_key');
      if (groupId !== null) {
        setGroup(groupId);
        setSelectionMade(true);
      }
    };
    fetchLocalStorage();
  }, [group]);

  if (!useRallye) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, styles.TextDeactivated]}>
          Es ist aktuell keine Rallye aktiv.
        </Text>
        <UIButton size="small" onClick={() => setEnabled(false)}>
          Zurück zur Anmeldung
        </UIButton>
      </View>
    );
  }

  const renameGroup = async (groupId) => {
    if (newGroupName !== '') {
      await supabase
        .from('rallye_group')
        .update({ name: newGroupName })
        .eq('id', groupId);
      setNewGroupName('');

      // Refresh groups
      const { data: groups } = await supabase
        .from('rallye_group')
        .select('*')
        .eq('rallye_id', rallye.id)
        .order('id', { ascending: false });
      setGroups(groups);
    }
  };

  return (
    <ScrollView>
      {groups?.map((item, index) => (
        <View
          key={index}
          style={[
            styles.section,
            {
              borderColor:
                item.id === group ? Colors.dhbwRed : 'white',
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: item.id === group ? Colors.dhbwRed : 'black' },
            ]}
          >
            Gruppe {index + 1}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name der Gruppe:</Text>
            <Text style={styles.value}>{item.name}</Text>
          </View>
          {item.id === group && (
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                onChangeText={setNewGroupName}
                value={newGroupName}
                placeholder="Neuer Gruppenname"
              />
            </View>
          )}

          {item.id === group && (
            <View
              style={
                !newGroupName
                  ? styles.buttonContainerDeactive
                  : styles.buttonContainer
              }
            >
              <Button
                color={
                  Platform.OS === 'ios'
                    ? 'white'
                    : Colors.contrastBlue
                }
                title="Umbenennen"
                onPress={() => renameGroup(item.id)}
                disabled={!newGroupName}
              />
            </View>
          )}
          <UIButton
            size="small"
            color="grey"
            outline={true}
            onClick={async () => {
              setGroup(item.id);
              setSelectionMade(true);
              await supabase
                .from('rallye_group')
                .update({ used: true })
                .eq('id', item.id);
              await storeData('group_key', item.id);
            }}
            disabled={selectionMade}
          >
            Auswählen
          </UIButton>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 20,
    color: 'grey',
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    padding: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    padding: 10,
  },
  buttonContainer: {
    backgroundColor: Colors.contrastBlue,
    margin: 6,
    borderRadius: 5,
  },
  buttonContainerDeactive: {
    backgroundColor: Colors.dhbwGray,
    margin: 6,
    borderRadius: 5,
  },
  TextDeactivated: {
    marginBottom: 20,
  },
});
