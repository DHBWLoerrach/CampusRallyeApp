import { View, Text, StyleSheet } from 'react-native';
import { useSharedStates } from '../utils/SharedStates';
import Colors from '../utils/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/Supabase';
import { ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { getData,storeData } from '../utils/LocalStorage';

export default function GroupScreen() {
  // import shared states
  const { groups,setGroups } = useSharedStates();
  const {group,
    setGroup} = useSharedStates();
  const { questions, setQuestions } = useSharedStates();
  const {currentQuestion} = useSharedStates();
  const {points,rallye} = useSharedStates();
  const [loading, setLoading] = useState(true);
  const [selectionMade, setSelectionMade] = useState(true);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const fetchDataSupabase = async () => {
      const { data: groups } = await supabase
        .from('rallye_group')
        .select('*')
        .eq('rallye_id', rallye.id);
      
      setGroups(groups);
      setLoading(false);
    };
    const fetchLocalStorage = async () =>{
      groupId= await getData('group_key')
      console.log(groupId)
      if(groupId!== null){
        setGroup(groupId);
      }
    }
    fetchDataSupabase();
    fetchLocalStorage();
  }, []);

  return (
    <ScrollView>
      {groups && groups.map((group, index) => (
        <TouchableOpacity key={index} onPress={async () => {setGroup(group.id); setSelectionMade(true);await storeData('group_key',group.id)}}>
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>Gruppe {index + 1}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name der Gruppe:</Text>
            <Text style={styles.value}>{group.name}</Text>
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
        </View>
        </TouchableOpacity>
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
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: Colors.dhbwGray,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  answerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  answer: {
    fontSize: 16,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
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
