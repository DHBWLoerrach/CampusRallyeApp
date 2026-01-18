import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { MaterialIcons } from '@expo/vector-icons';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { confirm } from '@/utils/ConfirmAlert';

/** Cost of using a hint in points */
const HINT_COST = 1;

export default function Hint({ hint }: { hint: string }) {
  const { t } = useLanguage();
  const currentQuestion = useSelector(() =>
    store$.currentQuestion.get()
  ) as any;
  const questionId = currentQuestion?.id as number | undefined;
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

    // Mark hint as used for this question
    store$.usedHints[questionId].set(true);

    // Deduct points from accumulated total (not per-question object mutation)
    const currentPoints = store$.points.get();
    store$.points.set(Math.max(0, currentPoints - HINT_COST));

    Alert.alert(t('hint.title'), hint);
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
