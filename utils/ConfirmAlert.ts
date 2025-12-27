import { Alert } from 'react-native';
import { store$ } from '@/services/storage/Store';

export const confirmAlert = (
  answer: string,
  onConfirm: () => void,
  language: 'de' | 'en' = 'de'
) => {
  const rallye = store$.rallye.get();
  if (rallye?.tour_mode) {
    onConfirm();
    return;
  }
  Alert.alert(
    language === 'de' ? 'Sicherheitsfrage' : 'Security question',
    language === 'de'
      ? `Willst du wirklich "${answer}" als Antwort abschicken?`
      : `Do you really want to submit "${answer}" as your answer?`,
    [
      { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
      {
        text:
          language === 'de'
            ? 'Ja, ich möchte die Antwort abschicken'
            : 'Yes, I want to submit the answer',
        onPress: onConfirm,
      },
    ]
  );
};
