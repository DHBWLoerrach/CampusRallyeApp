import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView } from 'react-native';
import {useSharedStates} from '../sharedStates'
import { supabase } from '../../../supabase';

export default function Wissensfragen () {
  // import shared States
  const {fragen, setFragen} = useSharedStates();
  const {aktuelleFrage, setAktuelleFrage} = useSharedStates();
  const {points, setPoints} = useSharedStates();
  const [answer, setAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [confirmedAnswer, setConfirmedAnswer] = useState("");
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: answer, error } = await supabase
      .from('Wissensfragen')
      .select('Antwort, Punkte') 
      .eq('fragen_id', fragen[aktuelleFrage].fragen_id);
      setCorrectAnswer(answer)
    };
    fetchData();
  }, [!answered]);

  const handleNext = () => {
    if (answer.trim() === correctAnswer[0].Antwort){
      setPoints(points+correctAnswer[0].Punkte);
    }
    setAktuelleFrage(aktuelleFrage+1);   
    setAnswer(""); 
    setAnswered(false);
  };

  const handleAnswerSubmit = () => {
    setAnswered(true);
    if (answer.trim() === '') {
      Alert.alert('Fehler', 'Bitte geben Sie eine Antwort ein.');
      return;
    }

    Alert.alert(
      "Sicherheitsfrage",
      `Bist du sicher, dass "${answer}" deine endgültige Antwort ist?`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Ja, Antwort bestätigen",
          onPress: () => handleNext(),
        },
      ],
    );
  };
  
  return (
    <ScrollView>
    <View style={styles.container}>
      <Text style={styles.question}>{fragen[aktuelleFrage].frage}</Text>
      <Text style={styles.inputLabel}>Antwort:</Text>
      <TextInput
        style={styles.input}
        value={answer}
        onChangeText={setAnswer}
        placeholder="Gib hier deine Antwort ein"
      />
      <Button
        title="Antwort Absenden"
        onPress={handleAnswerSubmit}
        disabled={!answer}
      />
      
      {confirmedAnswer ? (
        <View style={styles.answerContainer}>
          <Text style={styles.answerLabel}>Bestätigte Antwort:</Text>
          <Text style={styles.answer}>{confirmedAnswer}</Text>
        </View>
      ) : null}
    </View>
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
  question: {
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
    borderColor: 'gray',
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
});
