import { View, Text, Button,StyleSheet } from 'react-native';
import { useSharedStates } from '../utils/SharedStates';
import Colors from '../utils/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/Supabase';
import { ScrollView } from 'react-native';
import { getData, storeData,deleteData } from '../utils/LocalStorage';

//todo:potenzielles Problem bei der Gruppen auswahl welches durch Signal R oder Refresh gelöst werden muss

export default function GroupScreen() {
  
  const { groups, setGroups } = useSharedStates();
  const { group,
    setGroup } = useSharedStates();
  const { questions, setQuestions } = useSharedStates();
  const { currentQuestion } = useSharedStates();
  const { points, rallye } = useSharedStates();
  const { useRallye } = useSharedStates();
  const [loading, setLoading] = useState(true);
  const [selectionMade, setSelectionMade] = useState(false);
  
if(useRallye){
  useEffect(() => {
    const fetchDataSupabase = async () => {
      const { data: groups } = await supabase
        .from('rallye_group')
        .select('*')
        .eq('rallye_id', rallye.id)
        .order('id',{ascending:false});
      setGroups(groups);
      setLoading(false);
    };
    fetchDataSupabase();

  const fetchLocalStorage = async () => {
    groupId = await getData('group_key')
    if (groupId !== null) {
      setGroup(groupId);
      setSelectionMade(true);
    }
  };
  fetchLocalStorage();

}, [group]);
}
 

  return (
    <ScrollView>
  {groups && groups.map((item, index) => (
    <View key={index} style={[styles.section, { backgroundColor:  item.id === group ? 'red' : 'white' }]}>
      <Text style={[styles.sectionTitle, { color: item.id === group? 'white' : 'black' }]}>Gruppe {index + 1}</Text>
      <View style={styles.row}>
        <Text style={[styles.label, { color: item.id === group? 'white' : 'black' }]}>Name der Gruppe:</Text>
        <Text style={[styles.value, { color: item.id === group ? 'white' : 'black' }]}>{item.name}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: item.id === group ? 'white' : 'black' }]}>Beantwortete Fragen:</Text>
        <Text style={[styles.value, { color: item.id === group? 'white' : 'black' }]}>{currentQuestion} von {questions.length}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: item.id === group ? 'white' : 'black' }]}>Aktuelle Punktzahl:</Text>
        <Text style={[styles.value, { color: item.id === group ? 'white' : 'black' }]}>{points}</Text>
      </View>
      <View style={!item.used && !selectionMade?styles.buttonContainer:styles.buttonContainerDeactive}>
      <Button
        title="Auswählen"
        color={'white'}
        onPress={async () => {
          /*if(selectionMade){
            setGroup(null);
            setSelectionMade(false);
            await supabase.from('rallye_group')
          .update({used:false})
          .eq('id', item.id);
            await deleteData('group_key'); //Enables the swapping of groups
          } else{*/
          setGroup(item.id); 
          setSelectionMade(true); 
          await supabase.from('rallye_group')
          .update({used:true})
          .eq('id', item.id);
          await storeData('group_key', item.id); 
          //}
        }}
        disabled={selectionMade}
      />
      </View>
      
    </View>
  ))}
</ScrollView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: Colors.dhbwRed,
    margin:6,
    borderRadius: 5,
    flex:1,
    alignSelf:'center',
  },
  buttonContainerDeactive:{
    backgroundColor: Colors.dhbwGray,
    margin:6,
    borderRadius: 5,
    flex:1,
    alignSelf:'center',
  },
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
