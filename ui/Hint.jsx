import { useState } from 'react';
import { Text, Alert, View } from 'react-native';
import { store$ } from '../utils/Store';
import UIButton from './UIButton';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/GlobalStyles';

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
    <View style={globalStyles.hintStyles.hintContainer}>
      {!showHint && (
        <UIButton onPress={handleHint} color={Colors.contrastBlue}>
          Tipp anfordern
        </UIButton>
      )}

      {showHint && (
        <>
          <Text style={globalStyles.hintStyles.hintTitle}>Tipp:</Text>
          <Text style={globalStyles.hintStyles.hintText}>{hint}</Text>
        </>
      )}
    </View>
  );
}
