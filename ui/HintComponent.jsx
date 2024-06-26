import { useState, useEffect } from 'react';
import {
  Button,
  Text,
  Alert,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { supabase } from '../utils/Supabase';
import { useSharedStates } from '../utils/SharedStates';
import Colors from '../utils/Colors';

export default function HintComponent({ questionId }) {
  const [hints, setHints] = useState([]);
  const [showHint, setShowHint] = useState(false);

  const { questions, currentQuestion } = useSharedStates();

  useEffect(() => {
    setHints([]);
    fetchHints();
  }, [currentQuestion]);

  const fetchHints = async () => {
    const { data: hints, error } = await supabase
      .from('questions_hints')
      .select('*')
      .eq('id', questionId)
      .limit(1);

    if (error) {
      console.error('Error fetching hints:', error);
      return;
    }

    setHints(hints);
  };

  const handleHint = () => {
    Alert.alert(
      'Sicherheitsfrage',
      `Seid ihr sicher, dass ihr einen Tipp erhalten möchtet? Das kostet euch ein paar Punkte.`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Ja, ich möchte einen Tipp',
          onPress: () => {
            setShowHint(true);
            questions[currentQuestion].points =
              questions[currentQuestion].points - hints[0].points;
          },
        },
      ]
    );
  };

  if (hints.length === 0) return null;

  return (
    <View style={styles.hintContainer}>
      {!showHint && (
        <View style={styles.blueButtonContainer}>
          <Button //Blue Button
            title="Tipp anfordern"
            onPress={handleHint}
            color={
              Platform.OS === 'ios' ? 'white' : Colors.contrastBlue
            }
          />
        </View>
      )}

      {showHint && (
        <>
          <Text style={styles.hintTitle}>Tipp:</Text>
          {hints.map((hint, index) => (
            <Text key={index} style={styles.hintText}>
              {hint.hint}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  hintTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  hintText: {
    fontSize: 18,
    marginTop: 10,
  },
  hintContainer: {
    marginTop: 20,
  },
  blueButtonContainer: {
    backgroundColor: Colors.contrastBlue,
    margin: 6,
    borderRadius: 5,
  },
});
