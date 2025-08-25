import { Alert } from 'react-native';

export const confirmAlert = (answer: string, onConfirm: () => void) => {
  Alert.alert(
    'Sicherheitsfrage',
    `Willst du wirklich "${answer}" als Antwort abschicken?`,
    [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Ja, ich möchte die Antwort abschicken', onPress: onConfirm },
    ]
  );
};

