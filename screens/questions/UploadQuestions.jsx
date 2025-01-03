import {
  Alert,
  Button,
  Linking,
  Platform,
  Text,
  ScrollView,
  View,
} from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MailComposer from 'expo-mail-composer';
import { store$ } from '../../utils/Store';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/GlobalStyles';
import UploadPhoto from './UploadPhoto';

export default function UploadQuestions() {
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const currentQuestion = store$.currentQuestion.get();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={globalStyles.uploadQuestionStyles.container}>
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

  const resizeImage = async (uri) => {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }], // Resize to a width of 800 pixels (adjust as needed)
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Compress to 70% quality
    );
    return manipResult.uri;
  };

  const handleSendEmail = async (uri) => {
    const resizedImageUri = await resizeImage(uri);

    let mailOptions = {
      recipients: [rallye.mail_adress],
      subject: 'Foto/Video -- Team: ' + team.name,
      body: `Das ist die Aufnahme unseres Teams!\n\nFrage: ${currentQuestion.question}`,
      attachments: [resizedImageUri],
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
            await store$.savePoints(true, currentQuestion.points);
            store$.gotoNextQuestion();
          },
        },
      ]
    );
  };

  return (
    <ScrollView>
      <View style={globalStyles.uploadQuestionStyles.container}>
        <Text style={globalStyles.default.question}>
          {currentQuestion.question}
        </Text>
        <UploadPhoto handleSendEmail={handleSendEmail} />
        <Text style={globalStyles.uploadQuestionStyles.infoText}>
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

        <View style={globalStyles.uploadQuestionStyles.redButtonContainer}>
          <Button //Red Button
            color={Platform.OS === 'ios' ? 'white' : Colors.dhbwRed}
            title="Weiter"
            onPress={handleAnswerSubmit}
            style={globalStyles.uploadQuestionStyles.buttons}
          />
        </View>
      </View>
    </ScrollView>
  );
}
