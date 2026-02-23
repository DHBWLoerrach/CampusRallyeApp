import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSelector } from '@legendapp/state/react';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { store$ } from '@/services/storage/Store';
import { submitAnswerAndAdvance } from '@/services/storage/answerSubmission';
import { haversineDistance, bearing, formatDistance } from '@/utils/geo';
import { globalStyles } from '@/utils/GlobalStyles';
import { useAppStyles } from '@/utils/AppStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { useKeyboard } from '@/utils/useKeyboard';
import { confirmAnswer, confirm } from '@/utils/ConfirmAlert';
import Colors from '@/utils/Colors';
import ThemedView from '@/components/themed/ThemedView';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';

// -- Constants ---------------------------------------------------------------

/** Minimum compass accuracy (0–3) to consider heading reliable. */
const MIN_HEADING_ACCURACY = 2;

/** Spring config for smooth arrow rotation. */
const ARROW_SPRING = {
  stiffness: 120,
  damping: 14,
  mass: 1,
} as const;

// -- Types -------------------------------------------------------------------

type Phase = 'navigating' | 'answering';

// -- Component ---------------------------------------------------------------

export default function GeocachingQuestion({ question }: QuestionProps) {
  const { t } = useLanguage();
  const s = useAppStyles();
  const { keyboardHeight, keyboardVisible } = useKeyboard();
  const team = store$.team.get();
  const answers = useSelector(() => store$.answers.get() as AnswerRow[]);

  // Phase: navigate first, then answer after arrival
  const [phase, setPhase] = useState<Phase>('navigating');

  // Location state
  const [distance, setDistance] = useState<number | null>(null);
  const [headingAccuracy, setHeadingAccuracy] = useState(0);
  const [locationDenied, setLocationDenied] = useState(false);

  // Answer state (for text input mode)
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // QR state (for QR input mode)
  const [scanMode, setScanMode] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const processingRef = useRef(false);

  // Reanimated shared value for arrow rotation (degrees)
  const arrowRotation = useSharedValue(0);

  // Refs for subscriptions
  const positionSubRef = useRef<Location.LocationSubscription | null>(null);
  const headingSubRef = useRef<Location.LocationSubscription | null>(null);

  // Target coordinates from question
  const targetLat = question.target_latitude;
  const targetLon = question.target_longitude;
  const radius = question.proximity_radius ?? 10;
  const inputType = question.geocaching_input_type ?? 'text';

  // Correct answer key (for text or QR verification)
  const correctAnswer = answers.find(
    (a) => a.question_id === question.id && a.correct
  );
  const correctText = (correctAnswer?.text ?? '').toLowerCase().trim();
  const answerKeyReady = correctText.length > 0;

  // Validate that question has coordinates
  const hasCoordinates =
    targetLat != null &&
    targetLon != null &&
    !isNaN(targetLat) &&
    !isNaN(targetLon);

  // -- Arrow animated style ---------------------------------------------------

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: '25deg' },
      { rotateZ: `${arrowRotation.value}deg` },
    ],
  }));

  // -- Location tracking ------------------------------------------------------

  const startTracking = useCallback(async () => {
    if (!hasCoordinates) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationDenied(true);
      return;
    }

    // Watch position
    positionSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1,
        timeInterval: 1_000,
      },
      (loc) => {
        const dist = haversineDistance(
          loc.coords.latitude,
          loc.coords.longitude,
          targetLat!,
          targetLon!,
        );
        setDistance(dist);

        // Check proximity
        if (dist <= radius) {
          setPhase('answering');
        }
      },
    );

    // Watch heading (compass)
    headingSubRef.current = await Location.watchHeadingAsync((heading) => {
      setHeadingAccuracy(heading.accuracy);

      if (heading.accuracy >= MIN_HEADING_ACCURACY) {
        // Calculate desired arrow direction:
        // bearing to target minus current compass heading
        // This makes the arrow always point toward the target relative to phone orientation
        // We need the latest position for bearing though —
        // keep a ref to last known position
        void Location.getLastKnownPositionAsync().then((pos) => {
          if (!pos) return;
          const targetBearing = bearing(
            pos.coords.latitude,
            pos.coords.longitude,
            targetLat!,
            targetLon!,
          );
          const rotation = targetBearing - heading.trueHeading;
          arrowRotation.value = withSpring(rotation, ARROW_SPRING);
        });
      }
    });
  }, [arrowRotation, hasCoordinates, radius, targetLat, targetLon]);

  useEffect(() => {
    if (phase === 'navigating') {
      void startTracking();
    }

    return () => {
      positionSubRef.current?.remove();
      headingSubRef.current?.remove();
    };
  }, [phase, startTracking]);

  // -- Answer submission (text) -----------------------------------------------

  const handleTextSubmit = async () => {
    const trimmed = answer.trim();
    if (!trimmed) {
      Alert.alert(t('common.errorTitle'), t('question.error.enterAnswer'));
      return;
    }
    if (!answerKeyReady) {
      Alert.alert(
        t('question.error.pleaseWaitTitle'),
        t('question.error.answerLoading'),
      );
      return;
    }
    const confirmed = await confirmAnswer({ answer: trimmed, t });
    if (!confirmed) return;

    setSubmitting(true);
    const isCorrect = trimmed.toLowerCase() === correctText;
    try {
      await submitAnswerAndAdvance({
        teamId: team?.id ?? null,
        questionId: question.id,
        answeredCorrectly: isCorrect,
        pointsAwarded: isCorrect ? question.points : 0,
        answerText: trimmed,
      });
      setAnswer('');
    } catch (e) {
      console.error('Error submitting geocaching answer:', e);
      Alert.alert(t('common.errorTitle'), t('question.error.saveAnswer'));
    } finally {
      setSubmitting(false);
    }
  };

  // -- QR scan handler --------------------------------------------------------

  const handleQRCode = ({ data }: { data: string }) => {
    if (processingRef.current) return;
    if (!answerKeyReady) {
      Alert.alert(
        t('question.error.pleaseWaitTitle'),
        t('question.error.qrLoading'),
      );
      return;
    }
    processingRef.current = true;
    setScanMode(false);

    if (correctText !== data.toLowerCase()) {
      Alert.alert(t('common.errorTitle'), t('question.qr.incorrect'));
      setTimeout(() => { processingRef.current = false; }, 2_000);
    } else {
      Alert.alert(t('common.ok'), t('question.qr.correctMessage'), [
        {
          text: t('common.next'),
          onPress: () => {
            void (async () => {
              try {
                await submitAnswerAndAdvance({
                  teamId: team?.id ?? null,
                  questionId: question.id,
                  answeredCorrectly: true,
                  pointsAwarded: question.points,
                });
              } catch (e) {
                console.error('Error submitting geocaching QR answer:', e);
                Alert.alert(
                  t('common.errorTitle'),
                  t('question.error.saveAnswer'),
                );
              } finally {
                processingRef.current = false;
              }
            })();
          },
        },
      ]);
    }
  };

  // -- Surrender handler ------------------------------------------------------

  const handleSurrender = async () => {
    const confirmed = await confirm({
      title: t('confirm.surrender.title'),
      message: t('confirm.surrender.message'),
      confirmText: t('confirm.surrender.confirm'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await submitAnswerAndAdvance({
        teamId: team?.id ?? null,
        questionId: question.id,
        answeredCorrectly: false,
        pointsAwarded: 0,
      });
    } catch (e) {
      console.error('Error submitting surrender:', e);
      Alert.alert(t('common.errorTitle'), t('question.error.saveAnswer'));
    } finally {
      setSubmitting(false);
    }
  };

  // -- Render: missing coordinates --------------------------------------------

  if (!hasCoordinates) {
    return (
      <ThemedView variant="background" style={globalStyles.default.container}>
        <VStack style={{ width: '100%', alignItems: 'center' }} gap={2}>
          <InfoBox mb={0}>
            <ThemedText
              variant="title"
              style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
            >
              {t('geocaching.error.noCoordinates')}
            </ThemedText>
          </InfoBox>
          <InfoBox mb={0}>
            <UIButton onPress={() => store$.gotoNextQuestion()}>
              {t('question.skip')}
            </UIButton>
          </InfoBox>
        </VStack>
      </ThemedView>
    );
  }

  // -- Render: location denied ------------------------------------------------

  if (locationDenied) {
    return (
      <ThemedView variant="background" style={globalStyles.default.container}>
        <VStack style={{ width: '100%', alignItems: 'center' }} gap={2}>
          <InfoBox mb={0}>
            <ThemedText
              variant="title"
              style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
            >
              {t('geocaching.error.locationDenied')}
            </ThemedText>
          </InfoBox>
          <InfoBox mb={0}>
            <UIButton onPress={() => { setLocationDenied(false); void startTracking(); }}>
              {t('geocaching.retryPermission')}
            </UIButton>
          </InfoBox>
          <InfoBox mb={0}>
            <UIButton color={Colors.dhbwGray} onPress={handleSurrender}>
              {t('common.surrender')}
            </UIButton>
          </InfoBox>
        </VStack>
      </ThemedView>
    );
  }

  // -- Render: navigation phase -----------------------------------------------

  if (phase === 'navigating') {
    const showCalibration = headingAccuracy < MIN_HEADING_ACCURACY;

    return (
      <ThemedView
        variant="background"
        style={[globalStyles.default.container, s.screen, { flex: 1 }]}
      >
        <VStack style={{ width: '100%', flex: 1 }} gap={2}>
          {/* Question title */}
          <InfoBox mb={0}>
            <ThemedText
              variant="title"
              style={[
                globalStyles.rallyeStatesStyles.infoTitle,
                s.text,
                { textAlign: 'left' },
              ]}
            >
              {question.question}
            </ThemedText>
          </InfoBox>

          {/* Arrow + distance */}
          <InfoBox mb={0} style={styles.arrowContainer}>
            {showCalibration ? (
              <View style={styles.calibrationOverlay}>
                <ThemedText
                  variant="body"
                  style={[s.text, { textAlign: 'center' }]}
                >
                  {t('geocaching.calibrate')}
                </ThemedText>
              </View>
            ) : (
              <Animated.View style={[styles.arrowWrapper, arrowStyle]}>
                <ThemedText style={styles.arrowEmoji}>➤</ThemedText>
              </Animated.View>
            )}

            {distance != null && (
              <ThemedText
                variant="title"
                style={[s.text, styles.distanceText]}
              >
                {formatDistance(distance)}
              </ThemedText>
            )}
          </InfoBox>

          {/* Surrender */}
          <InfoBox mb={0}>
            <UIButton
              icon="face-frown-open"
              color={Colors.dhbwGray}
              onPress={handleSurrender}
            >
              {t('common.surrender')}
            </UIButton>
          </InfoBox>
        </VStack>
      </ThemedView>
    );
  }

  // -- Render: answer phase (text input) --------------------------------------

  if (inputType === 'text') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ThemedScrollView
          variant="background"
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={false}
          contentInsetAdjustmentBehavior="never"
          bounces={Platform.OS === 'ios' ? false : undefined}
          scrollIndicatorInsets={{
            bottom:
              Platform.OS === 'ios' && keyboardVisible ? keyboardHeight : 0,
          }}
          contentContainerStyle={{ paddingBottom: keyboardHeight }}
        >
          <VStack
            style={[
              globalStyles.default.container,
              { alignItems: 'stretch', flex: 0, flexGrow: 0 },
            ]}
            gap={2}
          >
            <InfoBox mb={0}>
              <ThemedText style={[s.text, styles.arrivedBadge]}>
                ✓ {t('geocaching.arrived')}
              </ThemedText>
            </InfoBox>

            <InfoBox mb={0}>
              <ThemedText
                variant="title"
                style={[
                  globalStyles.rallyeStatesStyles.infoTitle,
                  s.text,
                  { textAlign: 'left' },
                ]}
              >
                {question.question}
              </ThemedText>
            </InfoBox>

            <InfoBox mb={0}>
              <ThemedTextInput
                style={[globalStyles.skillStyles.input]}
                value={answer}
                onChangeText={setAnswer}
                placeholder={t('question.placeholder.answer')}
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={handleTextSubmit}
              />
            </InfoBox>

            <InfoBox mb={0}>
              <UIButton
                color={
                  answer.trim() && answerKeyReady
                    ? Colors.dhbwRed
                    : Colors.dhbwGray
                }
                disabled={!answer.trim() || !answerKeyReady || submitting}
                loading={submitting}
                onPress={handleTextSubmit}
              >
                {t('question.submit')}
              </UIButton>
            </InfoBox>
          </VStack>
        </ThemedScrollView>
        {question.hint ? <Hint hint={question.hint} /> : null}
      </KeyboardAvoidingView>
    );
  }

  // -- Render: answer phase (QR input) ----------------------------------------

  if (!cameraPermission) return <View />;

  if (!cameraPermission.granted) {
    return (
      <ThemedView variant="background" style={globalStyles.default.container}>
        <ThemedText style={{ textAlign: 'center', marginBottom: 10 }}>
          {t('question.camera.needAccess')}
        </ThemedText>
        <UIButton onPress={requestCameraPermission}>
          {t('question.camera.allow')}
        </UIButton>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      variant="background"
      style={[globalStyles.default.container, s.screen, { flex: 1 }]}
    >
      <VStack style={{ width: '100%' }} gap={2}>
        <InfoBox mb={0}>
          <ThemedText style={[s.text, styles.arrivedBadge]}>
            ✓ {t('geocaching.arrived')}
          </ThemedText>
        </InfoBox>

        <InfoBox mb={0}>
          <ThemedText
            variant="title"
            style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
          >
            {question.question}
          </ThemedText>
        </InfoBox>

        {scanMode && (
          <InfoBox mb={0} style={globalStyles.qrCodeStyles.cameraBox}>
            <CameraView
              style={globalStyles.qrCodeStyles.camera}
              onBarcodeScanned={handleQRCode}
            />
          </InfoBox>
        )}

        <InfoBox mb={0}>
          <View style={globalStyles.qrCodeStyles.buttonRow}>
            <UIButton
              icon={scanMode ? 'circle-stop' : 'qrcode'}
              disabled={!answerKeyReady}
              onPress={() => setScanMode(!scanMode)}
            >
              {scanMode
                ? t('question.qr.hideCamera')
                : answerKeyReady
                  ? t('question.qr.scan')
                  : t('common.loading')}
            </UIButton>
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
      {question.hint ? <Hint hint={question.hint} /> : null}
    </ThemedView>
  );
}

// -- Styles -------------------------------------------------------------------

const styles = StyleSheet.create({
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  arrowWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowEmoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  distanceText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  calibrationOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  arrivedBadge: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2E7D32',
  },
});
