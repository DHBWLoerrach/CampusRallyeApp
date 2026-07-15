import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { store$ } from '@/services/storage/Store';
import { submitAnswerAndAdvance } from '@/services/storage/answerSubmission';
import { confirm } from '@/utils/ConfirmAlert';
import { useLanguage } from '@/utils/LanguageContext';
import { Logger } from '@/utils/Logger';
import type { Question } from '@/types/rallye';
import type { TranslationKey } from '@/utils/i18n';

type SubmitOptions = {
  isCorrect: boolean;
  answerText?: string;
  errorMessageKey?: TranslationKey;
};

type SurrenderOptions = {
  errorMessageKey?: TranslationKey;
  onConfirmed?: () => void;
};

export function useAnswerSubmission(question: Question) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const teamId = store$.team.get()?.id ?? null;

  const submit = useCallback(
    async ({
      isCorrect,
      answerText,
      errorMessageKey = 'question.error.saveAnswer',
    }: SubmitOptions): Promise<boolean> => {
      if (submitting) return false;
      setSubmitting(true);
      try {
        await submitAnswerAndAdvance({
          teamId,
          questionId: question.id,
          pointsAwarded: isCorrect ? question.point_value : 0,
          answerText,
        });
        return true;
      } catch (error) {
        Logger.error(
          'AnswerSubmission',
          `Error submitting answer for question ${question.id}`,
          error
        );
        Alert.alert(t('common.errorTitle'), t(errorMessageKey));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [question.id, question.point_value, submitting, t, teamId]
  );

  const surrender = useCallback(
    async ({
      errorMessageKey,
      onConfirmed,
    }: SurrenderOptions = {}): Promise<boolean> => {
      const confirmed = await confirm({
        title: t('confirm.surrender.title'),
        message: t('confirm.surrender.message'),
        confirmText: t('confirm.surrender.confirm'),
        cancelText: t('common.cancel'),
        destructive: true,
      });
      if (!confirmed) return false;
      onConfirmed?.();
      return submit({ isCorrect: false, errorMessageKey });
    },
    [submit, t]
  );

  return { submitting, submit, surrender };
}
