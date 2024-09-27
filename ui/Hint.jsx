import { useState, useEffect } from 'react';
import { Text, Alert, View, StyleSheet } from 'react-native';
import { store$ } from '../utils/Store';
import UIButton from './UIButton';
import Colors from '../utils/Colors';

export default function Hint({ hint }) {
  const [showHint, setShowHint] = useState(false);
  const currentQuestion = store$.currentQuestion.get();

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
            currentQuestion.points -= 1;
          },
        },
      ]
    );
  };

  return (
    <View style={styles.hintContainer}>
      {!showHint && (
        <UIButton onPress={handleHint} color={Colors.contrastBlue}>
          Tipp anfordern
        </UIButton>
      )}

      {showHint && (
        <>
          <Text style={styles.hintTitle}>Tipp:</Text>
          <Text style={styles.hintText}>{hint}</Text>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  hintTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  hintText: {
    fontSize: 18,
    marginTop: 10,
  },
  hintContainer: {
    marginTop: 20,
  },
});
