import React, { useRef, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { QuestionProps } from '@/types/rallye';
import { saveAnswer, uploadPhotoAnswer } from '@/services/storage/answerStorage';
import { store$ } from '@/services/storage/Store';
import Hint from '@/components/ui/Hint';
import UIButton from '@/components/ui/UIButton';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import ThemedView from '@/components/themed/ThemedView';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';

export default function UploadPhotoQuestion({ question }: QuestionProps) {
  const [picture, setPicture] = useState<{ uri: string } | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const s = useAppStyles();

  const team = store$.team.get();

  const submitSurrender = async () => {
    setPicture(null);
    try {
      if (team) await saveAnswer(team.id, question.id, false, 0);
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
        { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
        { text: language === 'de' ? 'Ja, ich möchte aufgeben' : 'Yes, I want to give up', onPress: submitSurrender },
      ]
    );
  };

  function PhotoCamera() {
    const [facing, setFacing] = useState<'back' | 'front'>('back');
    return (
      <ThemedView variant="background" style={globalStyles.default.container}>
        <View style={[globalStyles.rallyeStatesStyles.infoCameraBox, s.infoBox]}>
          <ThemedText style={globalStyles.rallyeStatesStyles.infoTitle}>
            {question.question}
          </ThemedText>
        </View>
        <View style={[globalStyles.rallyeStatesStyles.infoCameraBox, s.infoBox]}>
          <CameraView ref={cameraRef} style={globalStyles.uploadStyles.camera} facing={facing} />
        </View>
        <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
          <View style={globalStyles.qrCodeStyles.buttonRow}>
            <UIButton
              icon="camera"
              onPress={async () => {
                try {
                  const pic = await (cameraRef.current as any)?.takePictureAsync();
                  if (pic) setPicture(pic);
                } catch (error) {
                  console.log('error taking picture', error);
                }
              }}
            >
              Aufnahme
            </UIButton>
            <UIButton icon="camera-rotate" color={Colors.dhbwGray} onPress={() => setFacing((c) => (c === 'back' ? 'front' : 'back'))}>
              Kamera wechseln
            </UIButton>
            <UIButton icon="face-frown-open" color={Colors.dhbwGray} onPress={handleSurrender}>
              {language === 'de' ? 'Aufgeben' : 'Surrender'}
            </UIButton>
          </View>
        </View>
        {question.hint ? <Hint hint={question.hint} /> : null}
      </ThemedView>
    );
  }

  function ImagePreview() {
    return (
      <ThemedView variant="background" style={globalStyles.default.container}>
        <View style={[globalStyles.rallyeStatesStyles.infoCameraBox, s.infoBox]}>
          <ThemedText style={globalStyles.rallyeStatesStyles.infoTitle}>
            {question.question}
          </ThemedText>
        </View>
        <View style={globalStyles.rallyeStatesStyles.infoCameraBox}>
          <Image source={{ uri: picture?.uri }} style={globalStyles.uploadStyles.image} resizeMode="contain" />
        </View>

        <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
          <View style={globalStyles.qrCodeStyles.buttonRow}>
            <UIButton icon="recycle" color={Colors.dhbwGray} onPress={() => setPicture(null)}>
              Neues Foto
            </UIButton>
            <UIButton
              icon="envelope"
              onPress={async () => {
                if (!picture?.uri) return;
                await uploadPhotoAnswer(picture.uri);
                // uploadPhotoAnswer handles saving points, team_questions and navigation
              }}
            >
              Foto senden
            </UIButton>
            <UIButton icon="face-frown-open" color={Colors.dhbwGray} onPress={handleSurrender}>
              {language === 'de' ? 'Aufgeben' : 'Surrender'}
            </UIButton>
          </View>
          {question.hint ? <Hint hint={question.hint} /> : null}
        </View>
      </ThemedView>
    );
  }

  return picture ? <ImagePreview /> : <PhotoCamera />;
}
