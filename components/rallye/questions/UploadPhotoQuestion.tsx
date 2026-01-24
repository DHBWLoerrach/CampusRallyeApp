import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
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
import { confirm } from '@/utils/ConfirmAlert';
import ThemedView from '@/components/themed/ThemedView';
import ThemedText from '@/components/themed/ThemedText';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import { useAppStyles } from '@/utils/AppStyles';
import { useSelector } from '@legendapp/state/react';
import { outbox$ } from '@/services/storage/offlineOutbox';

type Picture = { uri: string };

type PhotoCameraProps = {
  cameraRef: React.RefObject<CameraView | null>;
  onSurrender: () => Promise<void>;
  onTakePicture: () => Promise<void>;
  question: QuestionProps['question'];
  s: ReturnType<typeof useAppStyles>;
  t: ReturnType<typeof useLanguage>['t'];
};

type ImagePreviewProps = {
  onNewPhoto: () => void;
  onSubmit: () => Promise<void>;
  onSurrender: () => Promise<void>;
  picture: Picture;
  question: QuestionProps['question'];
  sending: boolean;
  showOfflineNotice: boolean;
  s: ReturnType<typeof useAppStyles>;
  t: ReturnType<typeof useLanguage>['t'];
};

type QuestionLayoutProps = {
  children: React.ReactNode;
  hint: QuestionProps['question']['hint'];
  s: ReturnType<typeof useAppStyles>;
};

function QuestionLayout({ children, hint, s }: QuestionLayoutProps) {
  return (
    <ThemedView variant="background" style={s.screen}>
      <ScrollView
        testID="upload-photo-scroll"
        contentContainerStyle={globalStyles.default.refreshContainer}
      >
        {children}
      </ScrollView>
      {hint ? <Hint hint={hint} /> : null}
    </ThemedView>
  );
}

function PhotoCamera({
  cameraRef,
  onSurrender,
  onTakePicture,
  question,
  s,
  t,
}: PhotoCameraProps) {
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  return (
    <QuestionLayout hint={question.hint} s={s}>
      <VStack
        style={[
          globalStyles.default.container,
          { alignItems: 'stretch', flex: 0, flexGrow: 0 },
        ]}
        gap={2}
      >
        <InfoBox mb={0}>
          <ThemedText
            variant="title"
            style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
          >
            {question.question}
          </ThemedText>
        </InfoBox>
        <InfoBox mb={0} style={globalStyles.rallyeStatesStyles.infoCameraBox}>
          <CameraView
            ref={cameraRef}
            style={globalStyles.uploadStyles.camera}
            facing={facing}
          />
        </InfoBox>
        <InfoBox mb={0}>
          <View style={globalStyles.qrCodeStyles.buttonRow}>
            <UIButton icon="camera" onPress={onTakePicture}>
              {t('question.photo.take')}
            </UIButton>
            <UIButton
              icon="camera-rotate"
              color={Colors.dhbwGray}
              onPress={() => setFacing((c) => (c === 'back' ? 'front' : 'back'))}
            >
              {t('question.photo.switch')}
            </UIButton>
            <UIButton
              icon="face-frown-open"
              color={Colors.dhbwGray}
              onPress={onSurrender}
            >
              {t('common.surrender')}
            </UIButton>
          </View>
        </InfoBox>
      </VStack>
    </QuestionLayout>
  );
}

function ImagePreview({
  onNewPhoto,
  onSubmit,
  onSurrender,
  picture,
  question,
  sending,
  showOfflineNotice,
  s,
  t,
}: ImagePreviewProps) {
  return (
    <QuestionLayout hint={question.hint} s={s}>
      <VStack
        style={[
          globalStyles.default.container,
          { alignItems: 'stretch', flex: 0, flexGrow: 0 },
        ]}
        gap={2}
      >
        <InfoBox mb={0}>
          <ThemedText
            variant="title"
            style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
          >
            {question.question}
          </ThemedText>
        </InfoBox>
        <InfoBox mb={0} style={globalStyles.rallyeStatesStyles.infoCameraBox}>
          <Image
            source={{ uri: picture.uri }}
            style={globalStyles.uploadStyles.image}
            resizeMode="contain"
          />
        </InfoBox>
        <InfoBox mb={0}>
          <View style={globalStyles.qrCodeStyles.buttonRow}>
            <UIButton
              icon="recycle"
              color={Colors.dhbwGray}
              onPress={onNewPhoto}
            >
              {t('question.photo.new')}
            </UIButton>
            <UIButton
              icon="envelope"
              disabled={showOfflineNotice || sending}
              loading={sending}
              onPress={onSubmit}
            >
              {t('question.photo.send')}
            </UIButton>
            <UIButton
              icon="face-frown-open"
              color={Colors.dhbwGray}
              onPress={onSurrender}
            >
              {t('common.surrender')}
            </UIButton>
          </View>
          {showOfflineNotice ? (
            <ThemedText
              style={[
                { textAlign: 'center', marginTop: 10, opacity: 0.85 },
                s.text,
              ]}
            >
              {t('question.photo.offlineNotice')}
            </ThemedText>
          ) : null}
        </InfoBox>
      </VStack>
    </QuestionLayout>
  );
}

export default function UploadPhotoQuestion({ question }: QuestionProps) {
  const [picture, setPicture] = useState<Picture | null>(null);
  const [sending, setSending] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const mountedRef = useRef(true);
  const [permission, requestPermission] = useCameraPermissions();
  const { t } = useLanguage();
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
      console.error('Error surrendering:', error);
      Alert.alert(t('common.errorTitle'), t('question.error.surrender'));
    }
  };

  const handleSurrender = async () => {
    const confirmed = await confirm({
      title: t('confirm.surrender.title'),
      message: t('confirm.surrender.message'),
      confirmText: t('confirm.surrender.confirm'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    await submitSurrender();
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <QuestionLayout hint={question.hint} s={s}>
        <VStack
          style={[
            globalStyles.default.container,
            { alignItems: 'stretch', flex: 0, flexGrow: 0 },
          ]}
          gap={2}
        >
          <InfoBox mb={0}>
            <ThemedText
              variant="title"
              style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
            >
              {question.question}
            </ThemedText>
          </InfoBox>
          <InfoBox mb={0}>
            <ThemedText
              style={[{ textAlign: 'center', marginBottom: 10 }, s.text]}
            >
              {t('question.camera.needAccess')}
            </ThemedText>
            <UIButton onPress={requestPermission}>
              {t('question.camera.allow')}
            </UIButton>
            <View style={{ marginTop: 10 }}>
              <UIButton
                icon="face-frown-open"
                color={Colors.dhbwGray}
                onPress={handleSurrender}
              >
                {t('common.surrender')}
              </UIButton>
            </View>
          </InfoBox>
        </VStack>
      </QuestionLayout>
    );
  }

  const handleTakePicture = async () => {
    try {
      const pic = await (cameraRef.current as any)?.takePictureAsync();
      if (pic) setPicture(pic);
    } catch (error) {
      console.error('Error taking picture', error);
    }
  };

  const handleSubmitPhoto = async () => {
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
        Alert.alert(t('common.offline'), t('question.photo.offlineMessage'));
      }
    } catch (e) {
      console.error('Error submitting photo answer:', e);
      Alert.alert(t('common.errorTitle'), t('question.error.submitPhoto'));
    } finally {
      if (mountedRef.current) setSending(false);
    }
  };

  if (picture) {
    return (
      <ImagePreview
        onNewPhoto={() => setPicture(null)}
        onSubmit={handleSubmitPhoto}
        onSurrender={handleSurrender}
        picture={picture}
        question={question}
        sending={sending}
        showOfflineNotice={!!team?.id && !online}
        s={s}
        t={t}
      />
    );
  }

  return (
    <PhotoCamera
      cameraRef={cameraRef}
      onSurrender={handleSurrender}
      onTakePicture={handleTakePicture}
      question={question}
      s={s}
      t={t}
    />
  );
}
