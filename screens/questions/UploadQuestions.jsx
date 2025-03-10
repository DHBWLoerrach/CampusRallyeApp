import { Alert, Text, ScrollView, View, Linking } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MailComposer from 'expo-mail-composer';
import { store$ } from '../../services/storage/Store';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/GlobalStyles';
import UploadPhoto from './UploadPhoto';
import UIButton from '../../ui/UIButton';
import Hint from '../../ui/Hint';
import { ThemeContext } from '../../utils/ThemeContext';
import { useLanguage } from '../../utils/LanguageContext'; // Import LanguageContext

export default function UploadQuestions() {
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const currentQuestion = store$.currentQuestion.get();
  const [permission, requestPermission] = useCameraPermissions();
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  if (!permission?.granted) {
    return (
      <View style={[
        globalStyles.default.container,
        { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
      ]}>
        <Text style={{ textAlign: 'center', marginBottom: 10, color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text }}>
          {language === 'de' ? 'Wir brauchen Zugriff auf die Kamera' : 'We need access to the camera'}
        </Text>
        <UIButton onPress={requestPermission}>
          {language === 'de' ? 'Zugriff auf Kamera erlauben' : 'Allow access to camera'}
        </UIButton>
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
      subject: language === 'de' ? `Foto/Video -- Team: ${team.name}` : `Photo/Video -- Team: ${team.name}`,
      body: language === 'de' ? `Das ist die Aufnahme unseres Teams!\n\nFrage: ${currentQuestion.question}` : `This is the recording of our team!\n\nQuestion: ${currentQuestion.question}`,
      attachments: [resizedImageUri],
    };
    try {
      await MailComposer.composeAsync(mailOptions);
    } catch (error) {
      console.error(language === 'de' ? 'Fehler beim Senden der E-Mail: ' : 'Error sending email: ', error);
    }
  };

  const handleAnswerSubmit = () => {
    Alert.alert(
      language === 'de' ? 'Sicherheitsfrage' : 'Security question',
      language === 'de' ? 'Hast du die E-Mail mit dem Foto/Video gesendet?' : 'Did you send the email with the photo/video?',
      [
        { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
        {
          text: language === 'de' ? 'Ja, ich habe die E-Mail gesendet' : 'Yes, I sent the email',
          onPress: async () => {
            await store$.savePoints(true, currentQuestion.points);
            store$.gotoNextQuestion();
          },
        },
      ]
    );
  };

  return (
    <ScrollView 
      contentContainerStyle={[globalStyles.default.refreshContainer,{ backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }]}
    >
      <View style={globalStyles.default.container}>
        <View style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}>
          <Text style={[
            globalStyles.rallyeStatesStyles.infoTitle,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}>
            {currentQuestion.question}
          </Text>
        </View>

        <UploadPhoto handleSendEmail={handleSendEmail} />

        <View style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}>
          <Text style={[
            globalStyles.rallyeStatesStyles.infoSubtitle,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}>
            {language === 'de' ? 'Falls das Senden des Fotos/Videos hier nicht klappt, dann macht das Foto/Video auf dem Handy in der Kamera-App und schickt es per E-Mail mit dem Namen eures Teams an:' : 'If sending the photo/video does not work here, take the photo/video on the phone in the camera app and send it by email with the name of your team to:'}
          </Text>
          <Text
            style={{ color: Colors.dhbwRed, textAlign: 'center', padding: 10 }}
            onPress={() => Linking.openURL(`mailto:${rallye.mail_adress}`)}
          >
            {rallye.mail_adress}
          </Text>

          <UIButton onPress={handleAnswerSubmit}>
            {language === 'de' ? 'Weiter' : 'Next'}
          </UIButton>
        </View>

        {currentQuestion.hint && (
          <View style={[
            globalStyles.rallyeStatesStyles.infoBox,
            { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
          ]}>
            <Hint hint={currentQuestion.hint} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
