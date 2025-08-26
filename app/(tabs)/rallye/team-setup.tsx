import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { observer, useSelector } from '@legendapp/state/react';
import { supabase } from '@/utils/Supabase';
import { store$ } from '@/services/storage/Store';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import generateTeamName from '@/utils/RandomTeamNames';
import { setCurrentTeam } from '@/services/storage/teamStorage';
import ThemedView from '@/components/themed/ThemedView';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';

const TeamSetup = observer(function TeamSetup() {
  const [loading, setLoading] = useState(false);
  const s = useAppStyles();
  const rallye = useSelector(() => store$.rallye.get());
  const createTeam = async () => {
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
        store$.reset();
        store$.team.set(data);
        await setCurrentTeam(rallye.id, data);
      }
    } catch (e) {
      console.error('Error creating team:', e);
      Alert.alert(
        'Fehler',
        'Team konnte nicht erstellt werden. Bitte erneut versuchen.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView variant="background" style={globalStyles.default.container}>
      <ThemedText style={[globalStyles.teamStyles.title]}>
        {rallye?.name}
      </ThemedText>
      <View style={[globalStyles.teamStyles.container]}>
        <View style={[globalStyles.teamStyles.infoBox, s.infoBox]}>
          <ThemedText style={globalStyles.teamStyles.message}>
            {'Bilde ein Team, um an der Rallye teilzunehmen.'}
          </ThemedText>
          <UIButton disabled={loading} onPress={createTeam}>
            Team bilden
          </UIButton>
        </View>
      </View>
    </ThemedView>
  );
});

export default TeamSetup;
