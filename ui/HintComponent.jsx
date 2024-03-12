import { useState, useEffect } from 'react';
import { Button, Text, Alert, View, StyleSheet } from 'react-native';
import { supabase } from "../utils/Supabase";
import { useSetPoints } from "../utils/Points";
import { useSharedStates } from '../utils/SharedStates';


export default function HintComponent({ questionId }) {
  const [hints, setHints] = useState([]);
  const setPoints = useSetPoints();

  const {
    questions,
    currentQuestion,
  } = useSharedStates();

  useEffect(() => {
    setHints([]);
  }, [currentQuestion]);

  const fetchHints = async () => {
    const { data: hints, error } = await supabase
      .from("questions_hints")
      .select("*")
      .eq("id", questionId)
      .limit(1);
      console.log(hints);

    if (error) {
      console.error("Error fetching hints:", error);
      return;
    }

    if (hints.length === 0) {
      Alert.alert(
        "Keine Tipps verfügbar",
        "Für diese Frage sind keine Tipps angelegt."
      );
    } else {
        questions[currentQuestion].points = questions[currentQuestion].points - hints[0].points;
    }

    setHints(hints);
  };

  const handleHint = () => {
    Alert.alert(
      "Sicherheitsfrage",
      `Seid ihr sicher, dass ihr einen Tipp erhalten möchtet? Das kostet euch ein paar Punkte.`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Ja, ich möchte einen Tipp",
          onPress: () => fetchHints(),
        },
      ]
    );
  };

  return (
    <View style={styles.hintContainer}>
      <Button title="Tipp anfordern" onPress={handleHint} />
      {hints.length > 0 && <Text style={styles.hintTitle}>Tipp:</Text>}
      {hints.map((hint, index) => (
        <Text key={index} style={styles.hintText}>
          {hint.hint}
        </Text>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
    hintTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginTop: 20,
    },
    hintText: {
      fontSize: 18,
      marginTop: 10,
    },
    hintContainer: {
      marginTop: 20,
    },
  });
