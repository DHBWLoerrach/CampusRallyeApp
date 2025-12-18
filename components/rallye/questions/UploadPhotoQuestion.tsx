import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QuestionProps } from '@/types/rallye';
import {
  submitAnswerAndAdvance,
  submitPhotoAnswerAndAdvance,
} from '@/services/storage/answerSubmission';
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
import { useSelector } from '@legendapp/state/react';
import { outbox$ } from '@/services/storage/offlineOutbox';

export default function UploadPhotoQuestion({ question }: QuestionProps) {
  const [picture, setPicture] = useState<{ uri: string } | null>(null);
  const [sending, setSending] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const mountedRef = useRef(true);
  const [permission, requestPermission] = useCameraPermissions();
  const { language } = useLanguage();
  const s = useAppStyles();
  const online = useSelector(() => outbox$.online.get());

  const team = store$.team.get();

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const submitSurrender = async () => {
    setPicture(null);
    try {
      await submitAnswerAndAdvance({
        teamId: team?.id ?? null,
        questionId: question.id,
        answeredCorrectly: false,
        pointsAwarded: 0,
      });
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

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <ThemedView
        variant="background"
        style={[globalStyles.default.container, s.screen]}
      >
        <VStack style={{ width: '100%' }} gap={2}>
          <InfoBox mb={0}>
            <ThemedText
              style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
            >
              {question.question}
            </ThemedText>
          </InfoBox>
          <InfoBox mb={0}>
            <ThemedText style={[{ textAlign: 'center', marginBottom: 10 }, s.text]}>
              {language === 'de'
                ? 'Wir brauchen Zugriff auf die Kamera'
                : 'We need access to the camera'}
            </ThemedText>
            <UIButton onPress={requestPermission}>
              {language === 'de'
                ? 'Zugriff auf Kamera erlauben'
                : 'Allow access to camera'}
            </UIButton>
            <View style={{ marginTop: 10 }}>
              <UIButton
                icon="face-frown-open"
                color={Colors.dhbwGray}
                onPress={handleSurrender}
              >
                {language === 'de' ? 'Aufgeben' : 'Surrender'}
              </UIButton>
            </View>
          </InfoBox>
          {question.hint ? <Hint hint={question.hint} /> : null}
        </VStack>
      </ThemedView>
    );
  }

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
                    console.error('Error taking picture', error);
                  }
                }}
              >
                {language === 'de' ? 'Foto aufnehmen' : 'Take photo'}
              </UIButton>
              <UIButton
                icon="camera-rotate"
                color={Colors.dhbwGray}
                onPress={() => setFacing((c) => (c === 'back' ? 'front' : 'back'))}
              >
                {language === 'de' ? 'Kamera wechseln' : 'Switch camera'}
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
    const showOfflineNotice = !!team?.id && !online;

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
                {language === 'de' ? 'Neues Foto' : 'New photo'}
              </UIButton>
              <UIButton
                icon="envelope"
                disabled={showOfflineNotice || sending}
                loading={sending}
                onPress={async () => {
                  if (!picture?.uri) return;
                  setSending(true);
                  try {
                    if (!team?.id) {
                      await submitAnswerAndAdvance({
                        teamId: null,
                        questionId: question.id,
                        answeredCorrectly: true,
                        pointsAwarded: question.points,
                      });
                      return;
                    }

                    const result = await submitPhotoAnswerAndAdvance({
                      teamId: team.id,
                      questionId: question.id,
                      pointsAwarded: question.points,
                      imageUri: picture.uri,
                    });
                    if (result.status === 'requires_online') {
                      Alert.alert(
                        language === 'de' ? 'Offline' : 'Offline',
                        language === 'de'
                          ? 'Foto-Uploads benötigen eine Internetverbindung.'
                          : 'Photo uploads require an internet connection.'
                      );
                    }
                  } catch (e) {
                    console.error('Error submitting photo answer:', e);
                    Alert.alert(
                      language === 'de' ? 'Fehler' : 'Error',
                      language === 'de'
                        ? 'Foto konnte nicht gesendet werden.'
                        : 'Photo could not be sent.'
                    );
                  } finally {
                    if (mountedRef.current) setSending(false);
                  }
                }}
              >
                {language === 'de' ? 'Foto senden' : 'Send photo'}
              </UIButton>
              <UIButton icon="face-frown-open" color={Colors.dhbwGray} onPress={handleSurrender}>
                {language === 'de' ? 'Aufgeben' : 'Surrender'}
              </UIButton>
            </View>
            {showOfflineNotice ? (
              <ThemedText
                style={[
                  { textAlign: 'center', marginTop: 10, opacity: 0.85 },
                  s.text,
                ]}
              >
                {language === 'de'
                  ? 'Offline: Foto-Uploads benötigen Internet.'
                  : 'Offline: photo uploads require internet.'}
              </ThemedText>
            ) : null}
            {question.hint ? <Hint hint={question.hint} /> : null}
          </InfoBox>
        </VStack>
      </ThemedView>
    );
  }

  return picture ? <ImagePreview /> : <PhotoCamera />;
}
