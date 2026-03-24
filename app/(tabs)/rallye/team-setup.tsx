import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { observer, useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import {
  createTeamAuto,
  createTeamManual,
} from '@/services/storage/teamStorage';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import { Screen } from '@/components/ui/Screen';
import { useLanguage } from '@/utils/LanguageContext';
import Colors from '@/utils/Colors';
import { TeamCreationError } from '@/services/storage/teamErrors';
import { validateTeamName } from '@/services/storage/teamNameValidation';
import type { Team } from '@/types/rallye';

type ManualErrorKey =
  | 'teamSetup.manual.error.invalid'
  | 'teamSetup.manual.error.taken'
  | 'teamSetup.manual.error.network'
  | 'teamSetup.manual.error.unknown';

type AutoErrorKey =
  | 'teamSetup.auto.error.retryExhausted'
  | 'teamSetup.auto.error.network'
  | 'teamSetup.auto.error.unknown';

const TeamSetup = observer(function TeamSetup() {
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [loadingManual, setLoadingManual] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualTouched, setManualTouched] = useState(false);
  const [manualErrorKey, setManualErrorKey] =
    useState<ManualErrorKey | null>(null);
  const [autoCipherText, setAutoCipherText] = useState('');
  const autoCipherTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const s = useAppStyles();
  const { t } = useLanguage();
  const rallye = useSelector(() => store$.rallye.get());

  const validation = validateTeamName(manualName);
  const hasManualValidationError = manualTouched && !validation.valid;
  const combinedLoading = loadingAuto || loadingManual;
  const canSubmitManual = !combinedLoading && validation.valid;

  const buildCipherText = (length = 12): string => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let value = '';
    for (let i = 0; i < length; i += 1) {
      value += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return value;
  };

  const stopAutoCipherAnimation = () => {
    if (autoCipherTimerRef.current) {
      clearInterval(autoCipherTimerRef.current);
      autoCipherTimerRef.current = null;
    }
    setAutoCipherText('');
  };

  const startAutoCipherAnimation = () => {
    stopAutoCipherAnimation();
    setAutoCipherText(buildCipherText());
    autoCipherTimerRef.current = setInterval(() => {
      setAutoCipherText(buildCipherText());
    }, 110);
  };

  useEffect(() => {
    return () => {
      stopAutoCipherAnimation();
    };
  }, []);

  const finalizeTeamCreation = (team: Team) => {
    store$.reset();
    store$.team.set(team);
    store$.showTeamNameSheet.set(true);
  };

  const getManualErrorKey = (error: unknown): ManualErrorKey => {
    if (error instanceof TeamCreationError) {
      if (error.code === 'TEAM_NAME_INVALID') {
        return 'teamSetup.manual.error.invalid';
      }
      if (error.code === 'TEAM_NAME_TAKEN') {
        return 'teamSetup.manual.error.taken';
      }
      if (error.code === 'TEAM_CREATE_NETWORK_ERROR') {
        return 'teamSetup.manual.error.network';
      }
    }
    return 'teamSetup.manual.error.unknown';
  };

  const getAutoErrorKey = (error: unknown): AutoErrorKey => {
    if (error instanceof TeamCreationError) {
      if (error.code === 'TEAM_AUTO_RETRY_EXHAUSTED') {
        return 'teamSetup.auto.error.retryExhausted';
      }
      if (error.code === 'TEAM_CREATE_NETWORK_ERROR') {
        return 'teamSetup.auto.error.network';
      }
    }
    return 'teamSetup.auto.error.unknown';
  };

  const createAutoTeam = async () => {
    if (!rallye) return;
    startAutoCipherAnimation();
    setLoadingAuto(true);
    try {
      const createdTeam = await createTeamAuto(rallye.id, 5);
      finalizeTeamCreation(createdTeam);
    } catch (e) {
      Alert.alert(t('common.errorTitle'), t(getAutoErrorKey(e)));
    } finally {
      setLoadingAuto(false);
      stopAutoCipherAnimation();
    }
  };

  const createManualTeam = async () => {
    if (!rallye) return;

    setManualTouched(true);
    if (!validation.valid) {
      setManualErrorKey('teamSetup.manual.error.invalid');
      return;
    }

    setLoadingManual(true);
    setManualErrorKey(null);
    try {
      const createdTeam = await createTeamManual(manualName, rallye.id);
      finalizeTeamCreation(createdTeam);
    } catch (e) {
      setManualErrorKey(getManualErrorKey(e));
    } finally {
      setLoadingManual(false);
    }
  };

  const onManualNameChange = (value: string) => {
    setManualName(value);
    if (!manualTouched) {
      setManualTouched(true);
    }
    if (manualErrorKey) {
      setManualErrorKey(null);
    }
  };

  return (
    <Screen padding="none" contentStyle={globalStyles.default.container}>
      <ThemedText style={[globalStyles.teamStyles.title]}>
        {rallye?.name}
      </ThemedText>
      <View style={[globalStyles.teamStyles.container]}>
        <View style={[globalStyles.teamStyles.infoBox, s.infoBox]}>
          <ThemedText style={globalStyles.teamStyles.message}>
            {t('teamSetup.message')}
          </ThemedText>
          <UIButton
            disabled={combinedLoading}
            loading={loadingAuto}
            onPress={createAutoTeam}
          >
            {t('teamSetup.auto.button')}
          </UIButton>

          {loadingAuto ? (
            <View style={styles.autoGeneratingContainer}>
              <ThemedText style={styles.autoGeneratingTitle}>
                {t('teamSetup.auto.generating')}
              </ThemedText>
              <ThemedText style={styles.autoGeneratingCipher}>
                {autoCipherText}
              </ThemedText>
              <ThemedText style={styles.autoGeneratingHint}>
                {t('teamSetup.auto.generatingHint')}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.manualContainer}>
            <UIButton
              variant="secondary"
              disabled={combinedLoading}
              onPress={() => setShowManualInput((prev) => !prev)}
            >
              {t('teamSetup.manual.button')}
            </UIButton>

            {showManualInput ? (
              <View style={styles.manualForm}>
                <ThemedText style={styles.manualLabel}>
                  {t('teamSetup.manual.label')}
                </ThemedText>
                <ThemedTextInput
                  value={manualName}
                  onChangeText={onManualNameChange}
                  placeholder={t('teamSetup.manual.placeholder')}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!combinedLoading}
                  accessibilityLabel={t('teamSetup.manual.label')}
                />
                <ThemedText style={styles.manualHelper}>
                  {t('teamSetup.manual.helper')}
                </ThemedText>

                {hasManualValidationError || manualErrorKey ? (
                  <ThemedText style={styles.errorText}>
                    {t(manualErrorKey ?? 'teamSetup.manual.error.invalid')}
                  </ThemedText>
                ) : null}

                <UIButton
                  disabled={!canSubmitManual}
                  loading={loadingManual}
                  onPress={createManualTeam}
                >
                  {t('teamSetup.manual.submit')}
                </UIButton>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Screen>
  );
});

export default TeamSetup;

const styles = StyleSheet.create({
  autoGeneratingContainer: {
    marginTop: 10,
    marginBottom: 6,
    alignItems: 'center',
    gap: 2,
  },
  autoGeneratingTitle: {
    fontSize: 13,
    color: Colors.dhbwGray,
    fontWeight: '600',
  },
  autoGeneratingCipher: {
    fontSize: 16,
    letterSpacing: 2,
    color: Colors.dhbwRed,
    fontWeight: '700',
  },
  autoGeneratingHint: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  manualContainer: {
    marginTop: 12,
  },
  manualForm: {
    marginTop: 12,
    gap: 8,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dhbwGray,
  },
  manualHelper: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  errorText: {
    color: Colors.dhbwRed,
    fontSize: 13,
  },
});
