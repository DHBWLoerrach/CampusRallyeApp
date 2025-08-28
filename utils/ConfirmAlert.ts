import { Alert } from 'react-native';
import { store$ } from '@/services/storage/Store';

export const confirmAlert = (answer: string, onConfirm: () => void) => {
  const rallye = store$.rallye.get();
  if (rallye?.tour_mode) {
    onConfirm();
    return;
  }
  Alert.alert(
    'Sicherheitsfrage',
    `Willst du wirklich "${answer}" als Antwort abschicken?`,
    [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Ja, ich möchte die Antwort abschicken', onPress: onConfirm },
    ]
  );
};
