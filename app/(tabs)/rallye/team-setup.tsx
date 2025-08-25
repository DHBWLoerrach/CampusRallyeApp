import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { observer, useSelector } from '@legendapp/state/react';
import { supabase } from '@/utils/Supabase';
import { store$ } from '@/services/storage/Store';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/ui/UIButton';
import generateTeamName from '@/utils/RandomTeamNames';
import { setCurrentTeam } from '@/services/storage/teamStorage';

const TeamSetup = observer(function TeamSetup() {
  const [loading, setLoading] = useState(false);
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
    <View style={[globalStyles.default.container, { backgroundColor: Colors.lightMode.background }]}>
      <Text style={[globalStyles.teamStyles.title, { color: Colors.lightMode.dhbwGray }]}>
        {rallye?.name}
      </Text>
      <View style={[globalStyles.teamStyles.container, { backgroundColor: Colors.lightMode.background }]}>
        <View style={[globalStyles.teamStyles.infoBox, { backgroundColor: Colors.lightMode.card }]}>
          <Text style={[globalStyles.teamStyles.message]}>
            {'Bilde ein Team, um an der Rallye teilzunehmen.'}
          </Text>
          <UIButton disabled={loading} onPress={createTeam}>
            Team bilden
          </UIButton>
        </View>
      </View>
    </View>
  );
});

export default TeamSetup;

