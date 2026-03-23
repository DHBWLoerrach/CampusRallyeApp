import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { useSelector } from '@legendapp/state/react';
import { QuestionProps, AnswerRow } from '@/types/rallye';
import { store$ } from '@/services/storage/Store';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import Hint from '@/components/ui/Hint';
import Colors from '@/utils/Colors';
import { submitAnswerAndAdvance } from '@/services/storage/answerSubmission';
import { useLanguage } from '@/utils/LanguageContext';
import { confirm } from '@/utils/ConfirmAlert';
import ThemedView from '@/components/themed/ThemedView';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import { useAppStyles } from '@/utils/AppStyles';
import { useTheme } from '@/utils/ThemeContext';
import { getSoftCtaButtonStyles } from '@/utils/buttonStyles';

type NfcApi = {
  manager: {
    isSupported: () => Promise<boolean>;
    start: () => Promise<void>;
    requestTechnology: (tech: unknown, options?: unknown) => Promise<void>;
    getTag: () => Promise<unknown>;
    cancelTechnologyRequest: () => Promise<void>;
  };
  techNdef: unknown;
  decodeTextPayload: (payload: unknown) => string;
};

function getNfcApi(): NfcApi | null {
  if (Platform.OS === 'web') return null;

  // Expo Go cannot load custom native modules like react-native-nfc-manager.
  const appOwnership = (Constants as any)?.appOwnership;
  const executionEnvironment = (Constants as any)?.executionEnvironment;
  const isExpoGo =
    appOwnership === 'expo' || executionEnvironment === 'storeClient';
  if (isExpoGo) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-nfc-manager');
    const manager = mod?.default;
    const techNdef = mod?.NfcTech?.Ndef;
    const decodeTextPayload = mod?.Ndef?.text?.decodePayload;
    if (!manager || !techNdef || typeof decodeTextPayload !== 'function') {
      return null;
    }
    return {
      manager,
      techNdef,
      decodeTextPayload,
    };
  } catch {
    return null;
  }
}

function decodeRecordToText(
  record: any,
  decodeTextPayload: ((payload: unknown) => string) | null
): string {
  if (!decodeTextPayload) return '';
  try {
    const decoded = decodeTextPayload(record?.payload);
    return typeof decoded === 'string' ? decoded.trim() : '';
  } catch {
    return '';
  }
}

function bytesToHex(value: unknown): string {
  if (!Array.isArray(value)) return '';
  const bytes = value as number[];
  return bytes
    .map((part) => Number(part).toString(16).padStart(2, '0'))
    .join('')
    .trim();
}

function extractTagString(
  tag: any,
  decodeTextPayload: ((payload: unknown) => string) | null
): string {
  const firstTextRecord = (tag?.ndefMessage || [])
    .map((record: any) => decodeRecordToText(record, decodeTextPayload))
    .find((text: string) => text.length > 0);

  if (firstTextRecord) return firstTextRecord;

  const directCandidates = [
    tag?.id,
    tag?.serialNumber,
    tag?.identifier,
    tag?.tagId,
    bytesToHex(tag?.identifier),
    bytesToHex(tag?.id),
  ];

  const firstCandidate = directCandidates.find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );

  return typeof firstCandidate === 'string' ? firstCandidate.trim() : '';
}

export default function NFCQuestion({ question }: QuestionProps) {
  const nfcApi = useMemo(() => getNfcApi(), []);
  const processingRef = useRef(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const s = useAppStyles();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const cancelTextColor = palette.textMuted ?? Colors.mediumGray;
  const { buttonStyle: ctaButtonStyle, textStyle: ctaButtonTextStyle } =
    getSoftCtaButtonStyles(palette);

  const team = store$.team.get();
  const answers = useSelector(() => store$.answers.get() as AnswerRow[]);

  const expectedValue = useMemo(
    () =>
      (
        answers.find((a) => a.question_id === question.id && a.correct)?.text ||
        ''
      )
        .toLowerCase()
        .trim(),
    [answers, question.id]
  );

  const answerKeyReady = expectedValue.length > 0;

  const stopNfcSession = useCallback(async () => {
    if (!nfcApi) return;
    try {
      await nfcApi.manager.cancelTechnologyRequest();
    } catch {
      // Intentionally ignored; cancel may fail if no request is active.
    }
  }, [nfcApi]);

  const evaluateScannedValue = useCallback(
    (rawValue: string) => {
      const scannedValue = rawValue.toLowerCase().trim();
      if (!scannedValue) {
        Alert.alert(t('common.errorTitle'), t('nfc.error.noData'));
        return false;
      }

      if (scannedValue !== expectedValue) {
        Alert.alert(t('common.errorTitle'), t('nfc.error.incorrect'));
        return false;
      }

      Alert.alert(t('common.ok'), t('nfc.correctMessage'), [
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
                console.error('Error submitting NFC answer:', e);
                Alert.alert(
                  t('common.errorTitle'),
                  t('question.error.saveAnswer')
                );
              }
            })();
          },
        },
      ]);

      return true;
    },
    [expectedValue, question.id, question.points, t, team?.id]
  );

  const isManualFallbackAvailable = nfcSupported === false;

  useEffect(() => {
    let mounted = true;

    const initNfc = async () => {
      if (!nfcApi) {
        if (mounted) setNfcSupported(false);
        return;
      }
      try {
        const supported = await nfcApi.manager.isSupported();
        if (!supported) {
          if (mounted) setNfcSupported(false);
          return;
        }
        await nfcApi.manager.start();
        if (mounted) setNfcSupported(true);
      } catch {
        if (mounted) setNfcSupported(false);
      }
    };

    void initNfc();

    return () => {
      mounted = false;
      void stopNfcSession();
    };
  }, [nfcApi, stopNfcSession]);

  const submitSurrender = async () => {
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

  const handleScan = async () => {
    if (processingRef.current || scanning) return;

    if (!answerKeyReady) {
      Alert.alert(
        t('question.error.pleaseWaitTitle'),
        t('question.error.answerLoading')
      );
      return;
    }

    if (nfcSupported !== true) {
      Alert.alert(t('common.errorTitle'), t('nfc.error.notSupported'));
      return;
    }

    processingRef.current = true;
    setScanning(true);

    try {
      await nfcApi!.manager.requestTechnology(nfcApi!.techNdef, {
        alertMessage: t('nfc.scan.holdNear'),
      } as any);

      const tag = await nfcApi!.manager.getTag();
      const scannedValue = extractTagString(
        tag,
        nfcApi?.decodeTextPayload ?? null
      );
      evaluateScannedValue(scannedValue);
    } catch (e) {
      console.error('Error reading NFC tag:', e);
      setNfcSupported(false);
      Alert.alert(t('common.errorTitle'), t('nfc.error.readFailed'));
    } finally {
      await stopNfcSession();
      setScanning(false);
      setTimeout(() => {
        processingRef.current = false;
      }, 300);
    }
  };

  const handleManualSubmit = () => {
    if (!answerKeyReady) {
      Alert.alert(
        t('question.error.pleaseWaitTitle'),
        t('question.error.answerLoading')
      );
      return;
    }

    const value = manualValue.trim();
    if (!value) {
      Alert.alert(t('common.errorTitle'), t('nfc.manual.error.empty'));
      return;
    }

    const ok = evaluateScannedValue(value);
    if (ok) {
      setManualValue('');
      setShowManualModal(false);
    }
  };

  return (
    <ThemedView
      variant="background"
      style={[globalStyles.default.container, s.screen, { flex: 1 }]}
    >
      <VStack style={{ width: '100%' }} gap={2}>
        <InfoBox mb={0}>
          <ThemedText
            variant="title"
            style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
          >
            {question.question}
          </ThemedText>
        </InfoBox>

        {nfcSupported === false && (
          <InfoBox mb={0}>
            <ThemedText style={[globalStyles.rallyeStatesStyles.infoSubtitle, s.muted]}>
              {t('nfc.error.notSupported')}
            </ThemedText>
          </InfoBox>
        )}

        {!answerKeyReady && (
          <InfoBox mb={0}>
            <ThemedText style={[globalStyles.rallyeStatesStyles.infoSubtitle, s.muted]}>
              {t('nfc.error.answerKeyMissing')}
            </ThemedText>
          </InfoBox>
        )}

        <InfoBox mb={0}>
          <View style={globalStyles.qrCodeStyles.buttonRow}>
            <UIButton
              disabled={!answerKeyReady || scanning || nfcSupported === false}
              onPress={() => void handleScan()}
            >
              {scanning ? t('nfc.scan.reading') : t('nfc.scan.cta')}
            </UIButton>
            {isManualFallbackAvailable && (
              <UIButton
                icon="keyboard"
                onPress={() => setShowManualModal(true)}
              >
                {t('nfc.manual.cta')}
              </UIButton>
            )}
            <UIButton
              icon="face-frown-open"
              color={Colors.dhbwGray}
              onPress={() => void handleSurrender()}
            >
              {t('common.surrender')}
            </UIButton>
          </View>
        </InfoBox>
      </VStack>

      <Modal
        visible={showManualModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={globalStyles.rallyeModal.modalContainer}>
          <View
            style={{
              ...globalStyles.rallyeModal.modalContent,
              backgroundColor: isDarkMode
                ? Colors.darkMode.card
                : Colors.lightMode.card,
            }}
          >
            <ThemedText variant="title" style={globalStyles.rallyeModal.modalTitle}>
              {t('nfc.manual.title')}
            </ThemedText>
            <ThemedText style={globalStyles.rallyeModal.passwordHelper} variant="muted">
              {t('nfc.manual.description')}
            </ThemedText>
            <ThemedTextInput
              bordered
              style={globalStyles.rallyeModal.passwordInput}
              value={manualValue}
              onChangeText={setManualValue}
              placeholder={t('nfc.manual.placeholder')}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
            />
            <View
              style={[
                globalStyles.rallyeModal.cancelButtonSeparator,
                {
                  backgroundColor: isDarkMode
                    ? Colors.darkMode.borderSubtle
                    : Colors.veryLightGray,
                },
              ]}
            />
            <View style={globalStyles.rallyeModal.passwordButtonRow}>
              <UIButton
                variant="ghost"
                color={cancelTextColor}
                style={globalStyles.rallyeModal.cancelButton}
                textStyle={globalStyles.rallyeModal.cancelButtonText}
                onPress={() => setShowManualModal(false)}
              >
                {t('common.cancel')}
              </UIButton>
              <UIButton
                disabled={!answerKeyReady}
                onPress={handleManualSubmit}
                size="dialog"
                style={ctaButtonStyle}
                textStyle={ctaButtonTextStyle}
              >
                {t('nfc.manual.submit')}
              </UIButton>
            </View>
          </View>
        </View>
      </Modal>

      {question.hint ? <Hint hint={question.hint} /> : null}
    </ThemedView>
  );
}
