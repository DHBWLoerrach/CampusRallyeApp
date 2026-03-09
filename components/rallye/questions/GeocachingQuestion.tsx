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
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Ellipse } from 'react-native-svg';
import Compass3DArrow from './Compass3DArrow';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
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
import Logger from '@/utils/Logger';
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
const MIN_HEADING_ACCURACY = 1;

/** Seconds before calibration is auto-skipped. */
const CALIBRATION_TIMEOUT_S = 8;

/** Normalize an angle to 0..360 range. */
const normalizeDeg = (deg: number): number => ((deg % 360) + 360) % 360;

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
  const [calibrationSkipped, setCalibrationSkipped] = useState(false);

  // Answer state (for text input mode)
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // QR state (for QR input mode)
  const [scanMode, setScanMode] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const processingRef = useRef(false);

  // Mutable ref for the 3D arrow angle — written by sensor callbacks, read by Canvas
  const angleRef = useRef(0);
  // Tilt refs — written by DeviceMotion, read by 3D camera
  const tiltXRef = useRef(0);
  const tiltYRef = useRef(0);

  // Animated figure-8 illustration values
  const fig8X = useSharedValue(0);
  const fig8Y = useSharedValue(0);
  const fig8Rotate = useSharedValue(0);

  // Refs for subscriptions
  const positionSubRef = useRef<Location.LocationSubscription | null>(null);
  const headingSubRef = useRef<Location.LocationSubscription | null>(null);
  const deviceMotionSubRef = useRef<{ remove: () => void } | null>(null);
  const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
  // On Android, DeviceMotion.alpha is more reliable for compass heading
  const deviceMotionHeadingRef = useRef<number | null>(null);
  // Delta accumulator to prevent 360° animation jumps (Reanimated issue #4353)
  const prevRotationRef = useRef(0);
  const rotationDeltaRef = useRef(0);

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

  Logger.debug('Geocaching', `Init — target=(${targetLat}, ${targetLon}), radius=${radius}, inputType=${inputType}, hasCoords=${hasCoordinates}`);

  // -- Shared rotation updater (used by both iOS heading and Android DeviceMotion) --

  const updateArrowRotation = useCallback((compassHeading: number) => {
    const pos = lastPositionRef.current;
    if (!pos) {
      Logger.warn('Geocaching', 'No position cached yet — cannot compute bearing');
      return;
    }

    const targetBearing = bearing(
      pos.latitude,
      pos.longitude,
      targetLat!,
      targetLon!,
    );

    // Normalize to -180..180
    let rotation = normalizeDeg(targetBearing - compassHeading);
    if (rotation > 180) rotation -= 360;

    // Delta accumulator: prevent 360° animation jumps when crossing -180/180 boundary
    const diff = rotation - prevRotationRef.current;
    if (diff > 180) rotationDeltaRef.current -= 360;
    else if (diff < -180) rotationDeltaRef.current += 360;
    prevRotationRef.current = rotation;

    const continuousRotation = rotation + rotationDeltaRef.current;
    Logger.debug('Geocaching', `Arrow — bearing=${targetBearing.toFixed(1)}°, compass=${compassHeading.toFixed(1)}°, rot=${rotation.toFixed(1)}°, continuous=${continuousRotation.toFixed(1)}°`);
    angleRef.current = continuousRotation;
  }, [targetLat, targetLon]);

  // -- Location tracking ------------------------------------------------------

  const startTracking = useCallback(async () => {
    if (!hasCoordinates) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    Logger.debug('Geocaching', `Location permission status: ${status}`);
    if (status !== 'granted') {
      Logger.warn('Geocaching', 'Location permission denied');
      setLocationDenied(true);
      return;
    }

    // Seed initial position immediately so heading callback can compute bearing
    try {
      const initialPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      lastPositionRef.current = {
        latitude: initialPos.coords.latitude,
        longitude: initialPos.coords.longitude,
      };
      Logger.debug('Geocaching', `Initial position seeded — lat=${initialPos.coords.latitude.toFixed(6)}, lon=${initialPos.coords.longitude.toFixed(6)}`);
    } catch (e) {
      Logger.warn('Geocaching', 'Could not seed initial position', e);
    }

    // Watch position
    positionSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1,
        timeInterval: 1_000,
      },
      (loc) => {
        // Store position for bearing calculations in heading callback
        lastPositionRef.current = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        const dist = haversineDistance(
          loc.coords.latitude,
          loc.coords.longitude,
          targetLat!,
          targetLon!,
        );
        Logger.debug('Geocaching', `Position update — lat=${loc.coords.latitude.toFixed(6)}, lon=${loc.coords.longitude.toFixed(6)}, dist=${dist.toFixed(1)}m, accuracy=${loc.coords.accuracy?.toFixed(1)}m`);
        setDistance(dist);

        // Check proximity
        if (dist <= radius) {
          Logger.info('Geocaching', `Arrived! dist=${dist.toFixed(1)}m <= radius=${radius}m → switching to answering phase`);
          setPhase('answering');
        }
      },
    );

    // Watch heading (compass)
    // On iOS: watchHeadingAsync is reliable → compute rotation here
    // On Android: only used for accuracy state; rotation computed in DeviceMotion listener
    headingSubRef.current = await Location.watchHeadingAsync((heading) => {
      setHeadingAccuracy(heading.accuracy);

      // On Android: skip rotation computation here — done in DeviceMotion listener
      if (Platform.OS === 'android') {
        Logger.debug('Geocaching', `Heading (Android, info only) — true=${heading.trueHeading.toFixed(1)}°, mag=${heading.magHeading.toFixed(1)}°, acc=${heading.accuracy}`);
        return;
      }

      // iOS: use trueHeading, fall back to magHeading
      const compassHeading = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
      Logger.debug('Geocaching', `Heading (iOS) — using=${compassHeading.toFixed(1)}°, true=${heading.trueHeading.toFixed(1)}°`);

      updateArrowRotation(compassHeading);
    });

    // Watch device motion for tilt compensation + Android heading+rotation
    DeviceMotion.setUpdateInterval(50); // 20 fps
    deviceMotionSubRef.current = DeviceMotion.addListener(({ rotation: rot }) => {
      if (!rot) return;

      // On Android: derive compass heading from alpha and compute rotation HERE
      // (watchHeadingAsync is unreliable on many Android devices)
      if (Platform.OS === 'android') {
        const heading = normalizeDeg(360 - (rot.alpha * 180) / Math.PI);
        deviceMotionHeadingRef.current = heading;
        updateArrowRotation(heading);
      }

      // Feed device tilt into the 3D camera for perspective compensation
      tiltXRef.current = (rot.beta * 180) / Math.PI;
      tiltYRef.current = (rot.gamma * 180) / Math.PI;
    });
  }, [hasCoordinates, radius, targetLat, targetLon, updateArrowRotation]);

  useEffect(() => {
    if (phase === 'navigating') {
      void startTracking();
    }

    return () => {
      positionSubRef.current?.remove();
      headingSubRef.current?.remove();
      deviceMotionSubRef.current?.remove();
    };
  }, [phase, startTracking]);

  // Auto-skip calibration after timeout
  useEffect(() => {
    if (calibrationSkipped) return;
    if (headingAccuracy >= MIN_HEADING_ACCURACY) return;

    const timer = setTimeout(() => {
      Logger.info('Geocaching', `Calibration auto-skipped after ${CALIBRATION_TIMEOUT_S}s (accuracy was ${headingAccuracy})`);
      setCalibrationSkipped(true);
    }, CALIBRATION_TIMEOUT_S * 1_000);

    return () => clearTimeout(timer);
  }, [calibrationSkipped, headingAccuracy]);

  // Animate figure-8 path for calibration illustration
  useEffect(() => {
    const showCalibration =
      headingAccuracy < MIN_HEADING_ACCURACY && !calibrationSkipped;
    if (!showCalibration) return;

    // Horizontal: smooth oscillation
    fig8X.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-30, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(30, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Vertical: figure-8 cross pattern
    fig8Y.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 400, easing: Easing.inOut(Easing.sin) }),
        withTiming(20, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-20, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Gentle tilt rotation
    fig8Rotate.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-15, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(15, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [calibrationSkipped, fig8Rotate, fig8X, fig8Y, headingAccuracy]);

  const fig8Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: fig8X.value },
      { translateY: fig8Y.value },
      { rotateZ: `${fig8Rotate.value}deg` },
    ],
  }));

  // -- Answer submission (text) -----------------------------------------------

  const handleTextSubmit = async () => {
    const trimmed = answer.trim();
    Logger.debug('Geocaching', `Text submit — answer="${trimmed}", answerKeyReady=${answerKeyReady}, correctText="${correctText}"`);
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
    Logger.info('Geocaching', `Text answer evaluated — isCorrect=${isCorrect}, points=${isCorrect ? question.points : 0}`);
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
    Logger.debug('Geocaching', `QR scanned — data="${data}", answerKeyReady=${answerKeyReady}`);
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
      Logger.info('Geocaching', 'QR answer incorrect');
      Alert.alert(t('common.errorTitle'), t('question.qr.incorrect'));
      setTimeout(() => { processingRef.current = false; }, 2_000);
    } else {
      Logger.info('Geocaching', 'QR answer correct!');
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
    Logger.info('Geocaching', 'Surrender initiated');
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
    const showCalibration =
      headingAccuracy < MIN_HEADING_ACCURACY && !calibrationSkipped;
    Logger.debug('Geocaching', `Render navigating — showCalibration=${showCalibration}, headingAccuracy=${headingAccuracy}, calibrationSkipped=${calibrationSkipped}, distance=${distance}`);

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

          {/* Arrow + distance — override maxHeight so calibration ∞ is not clipped */}
          <InfoBox mb={0} style={styles.arrowContainer} maxHeight={600}>
            {showCalibration ? (
              <View style={styles.calibrationOverlay}>
                {/* Figure-8 track behind the phone */}
                <View style={styles.fig8TrackContainer}>
                  <Svg width={120} height={80} viewBox="0 0 120 80">
                    <Path
                      d="M60,40 C60,15 95,15 95,40 C95,65 60,65 60,40 C60,15 25,15 25,40 C25,65 60,65 60,40 Z"
                      stroke="#CCCCCC"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                      fill="none"
                    />
                  </Svg>
                  {/* Animated phone follows the figure-8 path */}
                  <Animated.View style={[styles.fig8PhoneAbsolute, fig8Style]}>
                    <Svg width={36} height={52} viewBox="0 0 36 52">
                      <Rect x="2" y="2" width="32" height="48" rx="6" ry="6"
                        fill="#37474F" stroke="#78909C" strokeWidth="1.5" />
                      <Rect x="5" y="8" width="26" height="32" rx="2" ry="2"
                        fill="#4FC3F7" />
                      <Ellipse cx="18" cy="46" rx="3" ry="3" fill="#546E7A" />
                    </Svg>
                  </Animated.View>
                </View>
                <ThemedText
                  variant="body"
                  style={[s.text, { textAlign: 'center', marginTop: 16 }]}
                >
                  {t('geocaching.calibrate')}
                </ThemedText>
                <UIButton
                  color={Colors.dhbwGray}
                  onPress={() => {
                    Logger.info('Geocaching', 'User manually skipped calibration');
                    setCalibrationSkipped(true);
                  }}
                  style={{ marginTop: 16 }}
                >
                  {t('geocaching.skipCalibration')}
                </UIButton>
              </View>
            ) : (
              <Compass3DArrow angleRef={angleRef} tiltXRef={tiltXRef} tiltYRef={tiltYRef} />
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
    minHeight: 240,
    paddingVertical: 8,
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
    paddingBottom: 32,
  },
  fig8TrackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 100,
  },
  fig8PhoneAbsolute: {
    position: 'absolute',
  },
  arrivedBadge: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2E7D32',
  },
});
