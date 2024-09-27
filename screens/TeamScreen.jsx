import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { observer } from '@legendapp/state/react';
import { store$ } from '../utils/Store';
import { supabase } from '../utils/Supabase';
import { getData, storeData } from '../utils/LocalStorage';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/Styles';
import Colors from '../utils/Colors';
import generateTeamName from '../utils/RandomTeamNames';

const TeamScreen = observer(function TeamScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();

  useEffect(() => {
    if (!rallye) {
      return;
    }
    const fetchLocalStorage = async () => {
      const teamId = await getData(rallye.id + '');
      if (teamId !== null) {
        const { data } = await supabase
          .from('rallye_group')
          .select('*')
          .eq('id', teamId);
        if (data.length > 0) {
          store$.team.set(data[0]);
        }
      }
    };
    fetchLocalStorage();
  }, [rallye]);

  if (!rallye) {
    return (
      <View style={globalStyles.container}>
        <Text style={[globalStyles.bigText, { marginBottom: 10 }]}>
          Du nimmst gerade nicht an einer Rallye teil.
        </Text>
        <UIButton
          icon="arrow-left"
          onPress={() => store$.enabled.set(false)}
        >
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
          {team.name}
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
        store$.team.set(data[0]);
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
});

export default TeamScreen;
