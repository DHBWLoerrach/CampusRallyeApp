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
import { useLanguage } from '@/utils/LanguageContext';

const TeamSetup = observer(function TeamSetup() {
  const [loading, setLoading] = useState(false);
  const s = useAppStyles();
  const { language } = useLanguage();
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
        // Kurze Bestätigung via Bottom Sheet im Rallye-Screen
        (store$ as any).showTeamNameSheet.set(true);
      }
    } catch (e) {
      console.error('Error creating team:', e);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Team konnte nicht erstellt werden. Bitte erneut versuchen.'
          : 'Team could not be created. Please try again.'
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
            {language === 'de'
              ? 'Bilde ein Team, um an der Rallye teilzunehmen.'
              : 'Form a team to participate in the rally.'}
          </ThemedText>
          <UIButton disabled={loading} onPress={createTeam}>
            {language === 'de' ? 'Team bilden' : 'Form team'}
          </UIButton>
        </View>
      </View>
    </ThemedView>
  );
});

export default TeamSetup;
