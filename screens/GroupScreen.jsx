import { View, Text, ScrollView, StyleSheet } from 'react-native';
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

  if (useRallye) {
    useEffect(() => {
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
  }

  if (!useRallye) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { marginBottom: 20 }]}>
          Es ist aktuell keine Rallye aktiv.
        </Text>
        <UIButton size="small" onClick={() => setEnabled(false)}>
          Zurück zur Anmeldung
        </UIButton>
      </View>
    );
  }

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
          <View style={styles.row}>
            <Text style={styles.label}>Beantwortete Fragen:</Text>
            <Text style={styles.value}>
              {currentQuestion} von {questions.length}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Aktuelle Punktzahl:</Text>
            <Text style={styles.value}>{points}</Text>
          </View>
          <UIButton
            size="small"
            color="grey"
            outline={true}
            onClick={async () => {
              /* if (selectionMade) {
                  setGroup(null);
                  setSelectionMade(false);
                  await supabase
                    .from('rallye_group')
                    .update({ used: false })
                    .eq('id', item.id);
                  await deleteData('group_key'); //Enables the swapping of groups
                } else { */
              setGroup(item.id);
              setSelectionMade(true);
              await supabase
                .from('rallye_group')
                .update({ used: true })
                .eq('id', item.id);
              await storeData('group_key', item.id);
              /* } */
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
});
