import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import Card from '@/components/ui/Card';
import RallyeSelectionModal from '@/components/ui/RallyeSelectionModal';
import { CollapsibleHeroHeader } from '@/components/ui/CollapsibleHeroHeader';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import { store$ } from '@/services/storage/Store';
import { useSelector } from '@legendapp/state/react';
import NetInfo from '@react-native-community/netinfo';
import ThemedText from '@/components/themed/ThemedText';
import { confirm } from '@/utils/ConfirmAlert';
import { useAppStyles } from '@/utils/AppStyles';
import {
  getActiveRallyes,
  setCurrentRallye,
  getTourModeRallye,
  type RallyeRow,
} from '@/services/storage/rallyeStorage';
import {
  getCurrentTeam,
  teamExists,
  clearCurrentTeam,
} from '@/services/storage/teamStorage';

export default function Welcome() {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const s = useAppStyles();

  const resumeAvailable = useSelector(() => store$.resumeAvailable.get());
  const resumeRallye = useSelector(() => store$.rallye.get());
  const resumeTeam = useSelector(() => store$.team.get());

  const [fetchState, setFetchState] = useState<
    'loading' | 'ready' | 'offline' | 'empty' | 'error'
  >('loading');
  const [joining, setJoining] = useState(false);

  const [showRallyeModal, setShowRallyeModal] = useState(false);
  const [activeRallyes, setActiveRallyes] = useState<RallyeRow[]>([]);
  const [hasTourMode, setHasTourMode] = useState(false);
  const hasActiveRallyes = activeRallyes.length > 0;

  const startTourMode = async () => {
    try {
      const tourRallye = await getTourModeRallye();
      if (tourRallye) {
        store$.team.set(null);
        store$.reset();
        store$.rallye.set(tourRallye);
        await setCurrentRallye(tourRallye);
        store$.enabled.set(true);
      } else {
        Alert.alert(t('common.errorTitle'), t('welcome.tourModeUnavailable'));
      }
    } catch (e) {
      console.error('Error starting tour mode:', e);
      Alert.alert(t('common.errorTitle'), t('welcome.participationStartError'));
    }
  };

  const loadRallyes = async () => {
    setFetchState('loading');
    try {
      const netState = await NetInfo.fetch();
      const isOffline =
        netState.isConnected === false ||
        netState.isInternetReachable === false;
      if (isOffline) {
        setActiveRallyes([]);
        setHasTourMode(false);
        setFetchState('offline');
        return;
      }
    } catch (e) {
      console.error('Error checking network status:', e);
      setActiveRallyes([]);
      setHasTourMode(false);
      setFetchState('offline');
      return;
    }

    const { data, error } = await getActiveRallyes();
    if (error) {
      setActiveRallyes([]);
      setHasTourMode(false);
      setFetchState('error');
      return;
    }

    setActiveRallyes(data);
    if (data.length === 0) {
      const tourModeRallye = await getTourModeRallye();
      const tourModeAvailable = !!tourModeRallye;
      setHasTourMode(tourModeAvailable);
      setFetchState(tourModeAvailable ? 'ready' : 'empty');
      return;
    }

    setHasTourMode(false);
    setFetchState('ready');
  };

  useEffect(() => {
    void loadRallyes();
  }, []);

  const joinRallye = async (rallye: RallyeRow): Promise<boolean> => {
    if (joining) return false;
    setJoining(true);
    try {
      store$.team.set(null);
      store$.reset();
      store$.rallye.set(rallye);
      await setCurrentRallye(rallye);

      // Rehydrate previously created team for this rallye (if any)
      try {
        const existingTeam = await getCurrentTeam(rallye.id);
        if (existingTeam) {
          const exists = await teamExists(rallye.id, existingTeam.id);
          if (exists === 'exists') {
            store$.team.set(existingTeam);
          } else if (exists === 'missing') {
            await clearCurrentTeam(rallye.id);
            store$.team.set(null);
          } else {
            store$.team.set(existingTeam);
          }
        }
      } catch (rehydrateErr) {
        console.error('Error rehydrating team after join:', rehydrateErr);
        store$.team.set(null);
      }

      store$.enabled.set(true);
      return true;
    } catch (e) {
      console.error('Error joining rallye:', e);
      Alert.alert(t('common.errorTitle'), t('welcome.participationStartError'));
      return false;
    } finally {
      setJoining(false);
    }
  };

  const stateBackground = isDarkMode
    ? Colors.darkMode.background
    : Colors.lightMode.background;
  const compactCardStyle = globalStyles.welcomeStyles.compactCard;

  const LoadingContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.offline,
        {
          backgroundColor: stateBackground,
        },
      ]}
    >
      <ActivityIndicator size="large" color={Colors.dhbwRed} />
      <ThemedText
        variant="body"
        style={[globalStyles.welcomeStyles.text, s.muted, { marginTop: 16 }]}
      >
        {t('common.loading')}
      </ThemedText>
    </View>
  );

  const StateContent = ({ message }: { message: string }) => (
    <View
      style={[
        globalStyles.welcomeStyles.offline,
        {
          backgroundColor: stateBackground,
        },
      ]}
    >
      <ThemedText
        variant="body"
        style={[globalStyles.welcomeStyles.text, s.muted, { marginBottom: 20 }]}
      >
        {message}
      </ThemedText>
      <UIButton icon="rotate" onPress={loadRallyes}>
        {t('common.refresh')}
      </UIButton>
    </View>
  );

  const ReadyContent = () => (
    <View
      style={[
        globalStyles.welcomeStyles.container,
        {
          backgroundColor: stateBackground,
        },
      ]}
    >
      {!hasActiveRallyes && hasTourMode ? (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.noRallyes.title')}
          description={t('welcome.noRallyes.description')}
          icon="info.circle"
        />
      ) : null}
      {resumeAvailable && resumeRallye && resumeTeam ? (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.resume.title')}
          description={t('welcome.resume.details', {
            rallye: resumeRallye.name,
            team: resumeTeam.name,
          })}
          icon="clock"
        >
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <UIButton onPress={() => store$.enabled.set(true)}>
                {t('common.resume')}
              </UIButton>
            </View>
            <View style={{ flex: 1 }}>
              <UIButton
                outline
                color={Colors.dhbwRed}
                onPress={() => {
                  void (async () => {
                    const confirmed = await confirm({
                      title: t('welcome.clearParticipation.title'),
                      message: t('welcome.clearParticipation.message'),
                      confirmText: t('welcome.clearParticipation.confirm'),
                      cancelText: t('common.cancel'),
                      destructive: true,
                    });
                    if (!confirmed) return;
                    void store$.leaveRallye();
                  })();
                }}
              >
                {t('common.startOver')}
              </UIButton>
            </View>
          </View>
        </Card>
      ) : null}

      {hasActiveRallyes ? (
        <Card
          containerStyle={compactCardStyle}
          title={t('welcome.join.title')}
          description={t('welcome.join.description')}
          icon="mappin.and.ellipse"
        >
          <UIButton disabled={joining} onPress={() => setShowRallyeModal(true)}>
            {t('welcome.join.select')}
          </UIButton>
        </Card>
      ) : null}
      <Card
        containerStyle={compactCardStyle}
        title={t('welcome.explore.title')}
        description={t('welcome.explore.description')}
        icon="binoculars"
      >
        <UIButton outline onPress={startTourMode}>
          {t('welcome.explore.start')}
        </UIButton>
      </Card>
    </View>
  );

  return (
    <CollapsibleHeroHeader
      heroImage={require('../assets/images/app/dhbw-campus-header.png')}
      logoImage={require('../assets/images/app/dhbw-logo.png')}
      title={t('welcome.appTitle')}
    >
      {fetchState === 'loading' && <LoadingContent />}
      {fetchState === 'ready' && <ReadyContent />}
      {fetchState === 'offline' && (
        <StateContent message={t('welcome.offline')} />
      )}
      {fetchState === 'empty' && <StateContent message={t('welcome.empty')} />}
      {fetchState === 'error' && <StateContent message={t('welcome.error')} />}
      <RallyeSelectionModal
        visible={showRallyeModal}
        onClose={() => setShowRallyeModal(false)}
        activeRallyes={activeRallyes}
        onJoin={joinRallye}
        joining={joining}
      />
    </CollapsibleHeroHeader>
  );
}
