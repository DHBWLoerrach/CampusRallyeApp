import React, { useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { store$ } from '@/services/storage/Store';
import { MaterialIcons } from '@expo/vector-icons';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';

export default function Hint({ hint }: { hint: string }) {
  const [showHint, setShowHint] = useState(false);
  const currentQuestion = store$.currentQuestion.get() as any;
  const { language } = useLanguage();

  const handleHint = () => {
    if (!showHint) {
      Alert.alert(
        language === 'de' ? 'Sicherheitsfrage' : 'Security question',
        language === 'de'
          ? `Seid ihr sicher, dass ihr einen Tipp erhalten möchtet? Das kostet euch ein paar Punkte.`
          : `Are you sure you want to receive a hint? This will cost you some points.`,
        [
          { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
          {
            text:
              language === 'de'
                ? 'Ja, ich möchte einen Tipp'
                : 'Yes, I want a hint',
            onPress: () => {
              setShowHint(true);
              if (currentQuestion) currentQuestion.points -= 1;
              Alert.alert(language === 'de' ? 'Tipp' : 'Hint', hint);
            },
          },
        ]
      );
    } else {
      Alert.alert(language === 'de' ? 'Tipp' : 'Hint', hint);
    }
  };

  return (
    <TouchableOpacity style={globalStyles.fab} onPress={handleHint}>
      <MaterialIcons name="lightbulb-outline" size={24} color="white" />
    </TouchableOpacity>
  );
}

