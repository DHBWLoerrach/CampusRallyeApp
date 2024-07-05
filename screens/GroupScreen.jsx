import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { supabase } from '../utils/Supabase';
import { useSharedStates } from '../utils/SharedStates';
import { getData, storeData } from '../utils/LocalStorage';
import UIButton from '../ui/UIButton';
import IconButton from '../ui/IconButton';
import { globalStyles } from '../utils/Styles';
import Colors from '../utils/Colors';

export default function GroupScreen() {
  const {
    groups,
    setGroups,
    group,
    setGroup,
    rallye,
    useRallye,
    setEnabled,
  } = useSharedStates();
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
    };
    fetchDataSupabase();

    const fetchLocalStorage = async () => {
      groupId = await getData('group_key');
      if (groupId !== null) {
        setGroup(groupId);
      }
    };
    fetchLocalStorage();
  }, [group]);

  if (!useRallye) {
    return (
      <View style={globalStyles.container}>
        <Text style={[globalStyles.bigText, { marginBottom: 10 }]}>
          Es ist aktuell keine Rallye aktiv.
        </Text>
        <IconButton
          icon="arrow-left"
          label="Zurück zur Anmeldung"
          color={Colors.dhbwRed}
          onPress={() => setEnabled(false)}
        />
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

  const chooseGroup = async (groupId) => {
    setGroup(groupId);
    await supabase
      .from('rallye_group')
      .update({ used: true })
      .eq('id', groupId);
    await storeData('group_key', groupId);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }}>
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
              {
                color:
                  item.id === group
                    ? Colors.dhbwRed
                    : Colors.dhbwGray,
              },
            ]}
          >
            Gruppe {index + 1}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name der Gruppe:</Text>
            <Text style={styles.value}>{item.name}</Text>
          </View>
          {item.id === group && (
            <>
              <TextInput
                style={styles.input}
                onChangeText={setNewGroupName}
                value={newGroupName}
                placeholder="Neuer Gruppenname"
              />
              <UIButton
                size="small"
                color={Colors.dhbwRed}
                onClick={() => renameGroup(item.id)}
                disabled={!newGroupName}
              >
                Namen der Gruppe ändern
              </UIButton>
            </>
          )}

          {!group && !item.used && (
            <UIButton
              size="small"
              color={Colors.dhbwRed}
              outline={true}
              onClick={() => chooseGroup(item.id)}
            >
              Auswählen
            </UIButton>
          )}

          {!group && item.used && (
            <UIButton
              size="small"
              outline={false}
              disabled={true}
              onClick={() => null}
            >
              Gruppe bereits vergeben
            </UIButton>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Elevation for Android
    elevation: 5,
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
