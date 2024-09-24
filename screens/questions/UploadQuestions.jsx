import {
  Alert,
  Button,
  Linking,
  Platform,
  Text,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as MailComposer from 'expo-mail-composer';
import { useSharedStates } from '../../utils/SharedStates';
import { useSetPoints } from '../../utils/Points';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/Styles';
import UploadPhoto from './UploadPhoto';

export default function UploadQuestions() {
  const [permission, requestPermission] = useCameraPermissions();

  const {
    questions,
    currentQuestion,
    setCurrentQuestion,
    teams,
    rallye,
  } = useSharedStates();
  const setPoints = useSetPoints();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>
          Wir brauchen Zugriff auf die Kamera
        </Text>
        <Button
          onPress={requestPermission}
          title="Zugriff auf Kamera erlauben"
        />
      </View>
    );
  }

  const handleSendEmail = async (uri) => {
    const theTeam = teams.find((team) => team.id === groupId);

    let mailOptions = {
      recipients: [rallye.mail_adress],
      subject: 'Foto/Video -- Team: ' + theTeam.name,
      body: `Das ist die Aufnahme unseres Teams!\n\nFrage: ${questions[currentQuestion].question}`,
      attachments: [uri],
    };
    try {
      await MailComposer.composeAsync(mailOptions);
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail: ', error);
    }
  };

  const handleAnswerSubmit = () => {
    Alert.alert(
      'Sicherheitsfrage',
      ` Hast du die E-Mail mit dem Foto/Video gesendet ?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Ja, ich habe die E-Mail gesendet',
          onPress: async () => {
            await setPoints(true, questions[currentQuestion].points);
            setCurrentQuestion(currentQuestion + 1);
          },
        },
      ]
    );
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={globalStyles.question}>
          {questions[currentQuestion].question}
        </Text>
        <UploadPhoto handleSendEmail={handleSendEmail} />
        <Text style={styles.infoText}>
          Falls das Senden des Fotos/Videos hier nicht klappt, dann
          macht das Foto/Video auf dem Handy in der Kamera-App und
          schickt es per E-Mail mit dem Namen eures Teams an:
        </Text>
        <Text
          style={{ color: 'blue' }}
          onPress={() =>
            Linking.openURL(`mailto:${rallye.mail_adress}`)
          }
        >
          {rallye.mail_adress}
        </Text>

        <View style={styles.redButtonContainer}>
          <Button //Red Button
            color={Platform.OS === 'ios' ? 'white' : Colors.dhbwRed}
            title="Weiter"
            onPress={handleAnswerSubmit}
            style={styles.buttons}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    margin: 10,
    borderRadius: 5,
  },
  buttons: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    marginBottom: 10,
    padding: 10,
  },
  redButtonContainer: {
    backgroundColor: Colors.dhbwRed,
    margin: 6,
    borderRadius: 5,
  },
});
