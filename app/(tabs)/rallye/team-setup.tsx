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
import { useTheme } from '@/utils/ThemeContext';

const TeamSetup = observer(function TeamSetup() {
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
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
    <View style={[globalStyles.default.container, { backgroundColor: palette.background }]}>
      <Text style={[globalStyles.teamStyles.title, { color: palette.dhbwGray }]}>
        {rallye?.name}
      </Text>
      <View style={[globalStyles.teamStyles.container, { backgroundColor: palette.background }]}>
        <View style={[globalStyles.teamStyles.infoBox, { backgroundColor: palette.card }]}>
          <Text style={[globalStyles.teamStyles.message, { color: palette.text }]}>
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
