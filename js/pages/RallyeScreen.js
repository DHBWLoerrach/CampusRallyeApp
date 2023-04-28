import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { supabase } from '../../supabase';
import Wissensfragen from './questions/Wissensfragen';
import BildFragen from './questions/BildFragen';
import QRCodeFragen from './questions/QRCodeFragen';
import {useSharedStates} from './sharedStates'

export default function RallyeScreen(props) {
  // import shared States
  const {fragen, setFragen} = useSharedStates();
  const {aktuelleFrage, setAktuelleFrage} = useSharedStates();
  const {points, setPoints} = useSharedStates();
  const [loading, setLoading] = useState(true);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: questions, error } = await supabase
      .from('Fragen')
      .select(); 

      // get random question as start point
      let startQuestion = questions[Math.floor(Math.random()*questions.length)];
      let index = questions.indexOf(startQuestion);
    
      // rotate array until startQuestion is first element in array
      for (let i = 0; i < index; i++) {
        let question = questions[0]
        questions.shift(questions.push(question));
      }
      setFragen(questions);
      setLoading(false);
    };
    fetchData();
  }, []);
  
  
  async function savePoints() {
    try {
      const updates = {
        Gruppenname: props.confirmedGroup,
        Punktzahl: points,
      };

      let { error } = await supabase.from('Gruppen').insert(updates);
      setUploaded(true);
      if (error) {
        throw error
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } 
  }
  
  let content;
  if (!loading && aktuelleFrage !== fragen.length) {
    if (fragen[aktuelleFrage].typ === 'Wissensfragen'){
      content = (
        <Wissensfragen />
      );
    } else if (fragen[aktuelleFrage].typ === 'Bild') {
      content = (
        <BildFragen />
      );
    } else if (fragen[aktuelleFrage].typ === 'QRFragen') {
      content = (
        <QRCodeFragen />
      );
    }   
  } else if (!loading) {
  
    content=(
      <View>
        <Text style={styles.endText}>Die Rallye wurde erforderlich beendet! Eure erreichte Punktzahl: {points}</Text>
        <Text style={styles.tileText}>Ladet gerne euren Gruppennamen und eure Punktzahl hoch, um im Ranking aufgenommen zu werden! Einfach auf 'Hochladen' klicken.</Text>
        <View>
          <Button
            title="Hochladen"
            onPress={() => savePoints()}
            color={'red'}
            disabled={uploaded}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },

  tile: {
    width: '80%',
    height: 100,
    marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'grey',
  },

  tileText: {
    fontSize: 20,
    color: 'grey',
  },

  endText: {
    fontSize: 30,
    color: 'grey',
  },
});



