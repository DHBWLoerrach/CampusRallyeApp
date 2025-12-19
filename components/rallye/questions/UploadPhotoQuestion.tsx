import React, { useRef, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { QuestionProps } from '@/types/rallye';
import {
  saveAnswer,
  uploadPhotoAnswer,
} from '@/services/storage/answerStorage';
import { store$ } from '@/services/storage/Store';
import Hint from '@/components/ui/Hint';
import UIButton from '@/components/ui/UIButton';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedView from '@/components/themed/ThemedView';
import ThemedText from '@/components/themed/ThemedText';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import { useAppStyles } from '@/utils/AppStyles';
import { Logger } from '@/utils/Logger';

export default function UploadPhotoQuestion({ question }: QuestionProps) {
  const [picture, setPicture] = useState<{ uri: string } | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
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
    const [facing, setFacing] = useState<'back' | 'front'>('back');
    return (
      <ThemedView variant="background" style={[globalStyles.default.container, s.screen]}>
        <VStack style={{ width: '100%' }} gap={2}>
          <InfoBox mb={0}>
            <ThemedText style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}>
              {question.question}
            </ThemedText>
          </InfoBox>
          <InfoBox mb={0} style={globalStyles.rallyeStatesStyles.infoCameraBox}>
            <CameraView ref={cameraRef} style={globalStyles.uploadStyles.camera} facing={facing} />
          </InfoBox>
          <InfoBox mb={0}>
            <View style={globalStyles.qrCodeStyles.buttonRow}>
              <UIButton
                icon="camera"
                onPress={async () => {
                  try {
                    const pic = await (cameraRef.current as any)?.takePictureAsync();
                    if (pic) setPicture(pic);
                  } catch (error) {
                    Logger.error('UploadPhoto', 'Error taking picture', error);
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
          </InfoBox>
          {question.hint ? <Hint hint={question.hint} /> : null}
        </VStack>
      </ThemedView>
    );
  }

  function ImagePreview() {
    return (
      <ThemedView variant="background" style={[globalStyles.default.container, s.screen]}>
        <VStack style={{ width: '100%' }} gap={2}>
          <InfoBox mb={0}>
            <ThemedText style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}>
              {question.question}
            </ThemedText>
          </InfoBox>
          <InfoBox mb={0} style={globalStyles.rallyeStatesStyles.infoCameraBox}>
            <Image source={{ uri: picture?.uri }} style={globalStyles.uploadStyles.image} resizeMode="contain" />
          </InfoBox>
          <InfoBox mb={0}>
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
          </InfoBox>
        </VStack>
      </ThemedView>
    );
  }

  return picture ? <ImagePreview /> : <PhotoCamera />;
}
