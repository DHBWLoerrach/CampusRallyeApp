import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { confirm } from '@/utils/ConfirmAlert';
import { HINT_COST, markHintUsed } from '@/services/storage/hintStorage';

export default function Hint({ hint }: { hint: string }) {
  const { t } = useLanguage();
  const currentQuestion = useSelector(() =>
    store$.currentQuestion.get()
  ) as any;
  const questionId = currentQuestion?.id as number | undefined;
  const rallyeId = useSelector(() => store$.rallye.get()?.id);
  const teamId = useSelector(() => store$.team.get()?.id);
  const alreadyUsed = useSelector(() =>
    questionId != null ? store$.usedHints[questionId].get() === true : false
  );

  const handleHint = async () => {
    if (!questionId) return;

    // If hint was already used for this question, just show it again
    if (alreadyUsed) {
      Alert.alert(t('hint.title'), hint);
      return;
    }

    // Confirm before first use (costs points)
    const confirmed = await confirm({
      title: t('hint.confirm.title'),
      message: t('hint.confirm.message', { cost: HINT_COST }),
      confirmText: t('hint.confirm.confirm'),
      cancelText: t('common.cancel'),
    });
    if (!confirmed) return;

    try {
      if (teamId != null) {
        if (rallyeId == null) {
          throw new Error('Cannot persist hint without a rallye ID');
        }
        await markHintUsed({ rallyeId, teamId, questionId });
      }

      store$.usedHints[questionId].set(true);
      Alert.alert(t('hint.title'), hint);
    } catch (error) {
      console.error('Failed to persist hint usage', error);
      Alert.alert(t('common.errorTitle'), t('hint.error.save'));
    }
  };

  return (
    <TouchableOpacity
      style={globalStyles.fab}
      onPress={handleHint}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.hintButton')}
      accessibilityHint={t('a11y.hintButtonHint')}
    >
      <MaterialIcons name="lightbulb-outline" size={24} color="white" />
    </TouchableOpacity>
  );
}
