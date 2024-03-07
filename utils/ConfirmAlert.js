import { Alert } from 'react-native';
import { getData, storeData } from '../utils/LocalStorage';

export async function confirmAlert(answer, handleNext) {
  const confirmAlertValue = await getData("confirmAlert");
  
  if(confirmAlertValue !== "skip"){
    Alert.alert(
      'Sicherheitsfrage',
      `Bist du sicher, dass "${answer}" deine endgültige Antwort ist?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Ja, Antwort bestätigen',
          onPress: () => handleNext(),
        },
        {
          text: 'Ja, Antwort bestätigen und nicht mehr Anzeigen',
          onPress: async () => {
            await storeData("confirmAlert","skip");
            handleNext();
          },
        }
      ]
    );
  } else {
    handleNext();
  }
}