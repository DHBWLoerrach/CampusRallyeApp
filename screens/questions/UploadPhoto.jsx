import { CameraView } from 'expo-camera';
import { useContext, useRef, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import {
  saveAnswer,
  uploadPhotoAnswer,
} from '../../services/storage/answerStorage';
import { store$ } from '../../services/storage/Store';
import Hint from '../../ui/Hint';
import UIButton from '../../ui/UIButton';
import Colors from '../../utils/Colors';
import { globalStyles } from '../../utils/GlobalStyles';
import { useLanguage } from '../../utils/LanguageContext';
import { ThemeContext } from '../../utils/ThemeContext';

export default function UploadPhoto() {
  const [picture, setPicture] = useState(null);
  const cameraRef = useRef(null);
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  const currentQuestion = store$.currentQuestion.get();
  const team = store$.team.get();

  const submitSurrender = async () => {
    setPicture(null);
    try {
      if (team && currentQuestion) {
        await saveAnswer(team.id, currentQuestion.id, false, 0);
      }
      store$.gotoNextQuestion();
    } catch (error) {
      console.error(
        language === 'de' ? 'Fehler beim Aufgeben:' : 'Error surrendering:',
        error
      );
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Beim Aufgeben ist ein Fehler aufgetreten.'
          : 'An error occurred while surrendering.'
      );
    }
  };

  const handleSurrender = () => {
    Alert.alert(
      language === 'de' ? 'Sicherheitsfrage' : 'Security question',
      language === 'de'
        ? 'Willst du diese Aufgabe wirklich aufgeben?'
        : 'Do you really want to give up this task?',
      [
        {
          text: language === 'de' ? 'Abbrechen' : 'Cancel',
          style: 'cancel',
        },
        {
          text:
            language === 'de'
              ? 'Ja, ich möchte aufgeben'
              : 'Yes, I want to give up',
          onPress: submitSurrender,
        },
      ]
    );
  };

  function PhotoCamera() {
    const [facing, setFacing] = useState('back');
    return (
      <View style={globalStyles.default.container}>
        <View
          style={[
            globalStyles.rallyeStatesStyles.infoCameraBox,
            {
              backgroundColor: isDarkMode
                ? Colors.darkMode.card
                : Colors.lightMode.card,
            },
          ]}
        >
          <Text
            style={[
              globalStyles.rallyeStatesStyles.infoTitle,
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
              },
            ]}
          >
            {currentQuestion.question}
          </Text>
        </View>
        <View
          style={[
            globalStyles.rallyeStatesStyles.infoCameraBox,
            {
              backgroundColor: isDarkMode
                ? Colors.darkMode.card
                : Colors.lightMode.card,
            },
          ]}
        >
          <CameraView
            ref={cameraRef}
            style={globalStyles.uploadStyles.camera}
            facing={facing}
          />
        </View>
        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <View style={globalStyles.qrCodeStyles.buttonRow}>
            <UIButton
              icon="camera"
              onPress={async () => {
                try {
                  const picture = await cameraRef.current.takePictureAsync();
                  setPicture(picture);
                } catch (error) {
                  console.log('error taking picture', error);
                }
              }}
            >
              Aufnahme
            </UIButton>
            <UIButton
              icon="camera-rotate"
              color={Colors.dhbwGray}
              onPress={() =>
                setFacing((current) => (current === 'back' ? 'front' : 'back'))
              }
            >
              Kamera wechseln
            </UIButton>
            <UIButton
              icon="face-frown-open"
              color={Colors.dhbwGray}
              onPress={handleSurrender}
            >
              {language === 'de' ? 'Aufgeben' : 'Surrender'}
            </UIButton>
          </View>
        </View>
        {currentQuestion.hint && <Hint hint={currentQuestion.hint} />}
      </View>
    );
  }

  function ImagePreview() {
    return (
      <View style={globalStyles.default.container}>
        <View
          style={[
            globalStyles.rallyeStatesStyles.infoCameraBox,
            {
              backgroundColor: isDarkMode
                ? Colors.darkMode.card
                : Colors.lightMode.card,
            },
          ]}
        >
          <Text
            style={[
              globalStyles.rallyeStatesStyles.infoTitle,
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
              },
            ]}
          >
            {currentQuestion.question}
          </Text>
        </View>
        <View style={globalStyles.rallyeStatesStyles.infoCameraBox}>
          <Image
            source={{ uri: picture.uri }}
            style={globalStyles.uploadStyles.image}
            resizeMode="contain"
          />
        </View>

        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <View style={globalStyles.qrCodeStyles.buttonRow}>
            <UIButton
              icon="recycle"
              color={Colors.dhbwGray}
              onPress={() => setPicture(null)}
            >
              Neues Foto
            </UIButton>
            <UIButton
              icon="envelope"
              onPress={() => uploadPhotoAnswer(picture.uri)}
            >
              Foto senden
            </UIButton>
            <UIButton
              icon="face-frown-open"
              color={Colors.dhbwGray}
              onPress={handleSurrender}
            >
              {language === 'de' ? 'Aufgeben' : 'Surrender'}
            </UIButton>
          </View>
          {currentQuestion.hint && <Hint hint={currentQuestion.hint} />}
        </View>
      </View>
    );
  }

  return picture ? <ImagePreview /> : <PhotoCamera />;
}
