import { Alert } from 'react-native';
import { store$ } from '@/services/storage/Store';

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
  language,
}: {
  answer: string;
  language: 'de' | 'en';
}) => {
  const rallye = store$.rallye.get();
  if (rallye?.tour_mode) return true;
  return confirm({
    title: language === 'de' ? 'Sicherheitsfrage' : 'Security question',
    message:
      language === 'de'
        ? `Willst du wirklich "${answer}" als Antwort abschicken?`
        : `Do you really want to submit "${answer}" as your answer?`,
    confirmText: language === 'de' ? 'Antwort senden' : 'Submit answer',
    cancelText: language === 'de' ? 'Abbrechen' : 'Cancel',
  });
};
