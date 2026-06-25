import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { observer, useSelector } from '@legendapp/state/react';
import { supabase } from '@/utils/Supabase';
import { store$ } from '@/services/storage/Store';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import generateTeamName from '@/utils/RandomTeamNames';
import { setCurrentTeam } from '@/services/storage/teamStorage';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import { Screen } from '@/components/ui/Screen';
import { useLanguage } from '@/utils/LanguageContext';

const TeamSetup = observer(function TeamSetup() {
  const [loading, setLoading] = useState(false);
  const s = useAppStyles();
  const { t } = useLanguage();
  const router = useRouter();
  const rallye = useSelector(() => store$.rallye.get());
  const createTeam = async () => {
    if (!rallye) return;
    setLoading(true);
    const teamName = generateTeamName();
    try {
      const { data, error } = await supabase
        .from('rallye_team')
        .insert({ name: teamName, rallye_id: rallye.id })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        store$.team.set(data);
        await setCurrentTeam(rallye.id, data);
        // Briefly confirm the generated team name via the native sheet route.
        router.push('/(tabs)/rallye/team-name-sheet');
      }
    } catch (e) {
      console.error('Error creating team:', e);
      Alert.alert(t('common.errorTitle'), t('teamSetup.error.message'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padding="none" contentStyle={globalStyles.default.container}>
      <ThemedText variant="screenTitle" style={globalStyles.teamStyles.title}>
        {rallye?.name}
      </ThemedText>
      <View style={[globalStyles.teamStyles.container]}>
        <View style={[globalStyles.teamStyles.infoBox, s.infoBox]}>
          <ThemedText
            variant="bodyLarge"
            style={globalStyles.teamStyles.message}
          >
            {t('teamSetup.message')}
          </ThemedText>
          <UIButton disabled={loading} onPress={createTeam}>
            {t('teamSetup.button')}
          </UIButton>
        </View>
      </View>
    </Screen>
  );
});

export default TeamSetup;
