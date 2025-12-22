import React, { useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { store$ } from '@/services/storage/Store';
import { MaterialIcons } from '@expo/vector-icons';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { confirm } from '@/utils/ConfirmAlert';

export default function Hint({ hint }: { hint: string }) {
  const [showHint, setShowHint] = useState(false);
  const currentQuestion = store$.currentQuestion.get() as any;
  const { language } = useLanguage();

  const handleHint = async () => {
    if (!showHint) {
      const confirmed = await confirm({
        title: language === 'de' ? 'Sicherheitsfrage' : 'Security question',
        message:
          language === 'de'
            ? 'Seid ihr sicher, dass ihr einen Tipp erhalten möchtet? Das kostet euch ein paar Punkte.'
            : 'Are you sure you want to receive a hint? This will cost you some points.',
        confirmText:
          language === 'de' ? 'Ja, ich möchte einen Tipp' : 'Yes, I want a hint',
        cancelText: language === 'de' ? 'Abbrechen' : 'Cancel',
      });
      if (!confirmed) return;
      setShowHint(true);
      if (currentQuestion) currentQuestion.points -= 1;
      Alert.alert(language === 'de' ? 'Tipp' : 'Hint', hint);
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
