import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { supabase } from '../utils/Supabase';
import { useSharedStates } from '../utils/SharedStates';
import { getData, storeData } from '../utils/LocalStorage';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/Styles';
import Colors from '../utils/Colors';
import generateTeamName from '../utils/RandomTeamNames';

export default function TeamScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState(null);
  const { team, setTeam, rallye, setEnabled } = useSharedStates();

  useEffect(() => {
    if (!rallye) {
      return;
    }
    const fetchLocalStorage = async () => {
      const teamId = await getData(rallye.id + '');
      if (teamId !== null) {
        const { data, error } = await supabase
          .from('rallye_group')
          .select('name')
          .eq('id', teamId);
        if (data.length > 0) {
          setTeamName(data[0].name);
          setTeam(teamId);
        }
      }
    };
    fetchLocalStorage();
  }, []);

  if (!rallye) {
    return (
      <View style={globalStyles.container}>
        <Text style={[globalStyles.bigText, { marginBottom: 10 }]}>
          Du nimmst gerade nicht an einer Rallye teil.
        </Text>
        <UIButton icon="arrow-left" onPress={() => setEnabled(false)}>
          Zurück zur Anmeldung
        </UIButton>
      </View>
    );
  }

  function ShowTeam({ gotoRallye }) {
    return (
      <>
        <Text style={[globalStyles.bigText]}>Name deines Teams:</Text>
        <Text
          style={[
            globalStyles.bigText,
            { color: Colors.dhbwRed, marginBottom: 20 },
          ]}
        >
          {teamName}
        </Text>
        <UIButton onPress={gotoRallye}>Gehe zur Rallye</UIButton>
      </>
    );
  }

  function BuildTeam() {
    async function createTeam() {
      setLoading(true);
      const teamName = generateTeamName();
      // TODO input name and validate team: unique, not empty, not too long
      try {
        const { data, error } = await supabase
          .from('rallye_group')
          .insert({
            name: teamName,
            rallye_id: rallye.id,
          })
          .select();
        setTeam(data[0].id);
        setTeamName(teamName);
        storeData(rallye.id + '', data[0].id);
      } catch (err) {
        console.log('error creating team: ', err);
      } finally {
        setLoading(false);
      }
    }

    return (
      <>
        <Text style={[globalStyles.bigText, { marginBottom: 10 }]}>
          Bilde ein Team, um an der Rallye teilzunehmen.
        </Text>
        <UIButton disabled={loading} onPress={createTeam}>
          Team bilden
        </UIButton>
      </>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text
        style={[
          globalStyles.bigText,
          { marginBottom: 10, fontWeight: '600' },
        ]}
      >
        {rallye.name}
      </Text>
      {team ? (
        <ShowTeam gotoRallye={() => navigation.navigate('rallye')} />
      ) : (
        <BuildTeam />
      )}
    </View>
  );
}
