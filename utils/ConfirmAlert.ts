import { Alert } from 'react-native';
import { store$ } from '@/services/storage/Store';
import type { Translator } from '@/utils/i18n';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

export const confirm = ({
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  destructive = false,
}: ConfirmOptions) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });

export const confirmAnswer = async ({
  answer,
  t,
}: {
  answer: string;
  t: Translator;
}) => {
  const rallye = store$.rallye.get();
  if (rallye?.tour_mode) return true;
  return confirm({
    title: t('confirm.answer.title'),
    message: t('confirm.answer.message', { answer }),
    confirmText: t('confirm.answer.confirm'),
    cancelText: t('common.cancel'),
  });
};
