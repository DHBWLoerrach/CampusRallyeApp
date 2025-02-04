import { useState, useEffect } from 'react';
import { Text, View } from "react-native";
import { observer } from '@legendapp/state/react';
import { store$ } from '../services/storage/Store';
import { supabase } from "../utils/Supabase";
import { getData, storeData } from "../services/storage/LocalStorage";
import UIButton from "../ui/UIButton";
import { globalStyles } from "../utils/GlobalStyles";
import generateTeamName from "../utils/RandomTeamNames";
import { createTeam, getCurrentTeam } from '../services/storage';

const TeamScreen = observer(function TeamScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();

  useEffect(() => {
    if (!rallye) return;
    
    const loadTeam = async () => {
      const team = await getCurrentTeam();
      if (team) {
        store$.team.set(team);
      }
    };
    
    loadTeam();
  }, [rallye]);

  if (!rallye) {
    return (
      <View style={globalStyles.default.container}>
        <Text style={[globalStyles.default.bigText, { marginBottom: 10 }]}>
          Du nimmst gerade nicht an einer Rallye teil.
        </Text>
        <UIButton icon="arrow-left" onPress={() => store$.enabled.set(false)}>
          Zurück zur Anmeldung
        </UIButton>
      </View>
    );
  }

  function ShowTeam({ gotoRallye }) {
    return (
      <View style={globalStyles.teamStyles.infoBox}>
        <Text style={globalStyles.teamStyles.message}>
          Name deines Teams:
        </Text>
        <Text style={globalStyles.teamStyles.teamName}>
          {team.name}
        </Text>
        <UIButton onPress={gotoRallye}>
          Gehe zur Rallye
        </UIButton>
      </View>
    );
  }

  function BuildTeam() {
    async function createTeam() {
      setLoading(true);
      const teamName = generateTeamName();

      try {
        const { data, error } = await supabase
          .from("rallyeTeam")
          .insert({
            name: teamName,
            rallye_id: rallye.id,
          })
          .select();

        if (error) throw error;

        if (data && data[0]) {
          store$.team.set(data[0]);
          await storeData(rallye.id + "", data[0].id);
        } else {
          throw new Error("No data returned from database");
        }
      } catch (err) {
        console.error("Error creating team:", err);
        Alert.alert(
          "Fehler",
          "Team konnte nicht erstellt werden. Bitte erneut versuchen."
        );
      } finally {
        setLoading(false);
      }
    }

    return (
      <View style={globalStyles.teamStyles.infoBox}>
        <Text style={globalStyles.teamStyles.message}>
          Bilde ein Team, um an der Rallye teilzunehmen.
        </Text>
        <UIButton disabled={loading} onPress={createTeam}>
          Team bilden
        </UIButton>
      </View>
    );
  }

  return (
    <View style={globalStyles.default.container}>
      <Text style={globalStyles.teamStyles.title}>{rallye.name}</Text>
      <View style={globalStyles.teamStyles.container}>
        {team ? (
          <ShowTeam gotoRallye={() => navigation.navigate("rallye")} />
        ) : (
          <BuildTeam />
        )}
      </View>
    </View>
  );
});

export default TeamScreen;
