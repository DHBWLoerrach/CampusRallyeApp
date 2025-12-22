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
  const { t } = useLanguage();

  const handleHint = async () => {
    if (!showHint) {
      const confirmed = await confirm({
        title: t('hint.confirm.title'),
        message: t('hint.confirm.message'),
        confirmText: t('hint.confirm.confirm'),
        cancelText: t('common.cancel'),
      });
      if (!confirmed) return;
      setShowHint(true);
      if (currentQuestion) currentQuestion.points -= 1;
      Alert.alert(t('hint.title'), hint);
    } else {
      Alert.alert(t('hint.title'), hint);
    }
  };

  return (
    <TouchableOpacity style={globalStyles.fab} onPress={handleHint}>
      <MaterialIcons name="lightbulb-outline" size={24} color="white" />
    </TouchableOpacity>
  );
}
