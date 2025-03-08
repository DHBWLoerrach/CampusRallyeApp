import { useState, useEffect, useContext } from "react";
import { Text, View } from "react-native";
import { observer } from "@legendapp/state/react";
import { store$ } from "../services/storage/Store";
import { supabase } from "../utils/Supabase";
import UIButton from "../ui/UIButton";
import { globalStyles } from "../utils/GlobalStyles";
import generateTeamName from "../utils/RandomTeamNames";
import { getCurrentTeam, setCurrentTeam } from "../services/storage";
import { ThemeContext } from "../utils/ThemeContext";
import Colors from "../utils/Colors";

const TeamScreen = observer(function TeamScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const { isDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    if (!rallye) return;

    const loadTeam = async () => {
      const localTeam = await getCurrentTeam(rallye.id);
      const {data: onlineTeam, error: teamError} = await supabase
        .from("rallyeTeam")
        .select("*")
        .eq("rallye_id", rallye.id)
        .eq("id", localTeam?.id)
        .single();

      if (localTeam && !teamError) {
        store$.team.set(localTeam);
      } else {
        store$.team.set(null);
      }
    };

    loadTeam();
  }, [rallye]);

  if (!rallye) {
    return (
      <View
        style={[
          globalStyles.default.container,
          { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
        ]}
      >
        <Text
          style={[
            globalStyles.default.bigText,
            { marginBottom: 10, color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}
        >
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
      <View style={[
              globalStyles.teamStyles.infoBox, 
              { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.background },
              //{ shadowColor: isDarkMode ? "#fff" : "#000" },
              ]}>
        <Text
          style={[
            globalStyles.teamStyles.message,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}
        >
          Name deines Teams:
        </Text>
        <Text
          style={[
            globalStyles.teamStyles.teamName,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}
        >
          {team.name}
        </Text>
        <UIButton onPress={gotoRallye}>Gehe zur Rallye</UIButton>
      </View>
    );
  }

  function BuildTeam() {
    async function createTeam() {
      setLoading(true);
      const teamName = generateTeamName();

      try {
        const { data, error } = await supabase
          .from("rallye_team")
          .insert({
            name: teamName,
            rallye_id: rallye.id,
          })
          .select();

        if (error) throw error;

        if (data && data[0]) {
          store$.reset();
          store$.team.set(data[0]);
          await setCurrentTeam(rallye.id, data[0]);
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
      <View style={[globalStyles.teamStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.background }]}>
        <Text
          style={[
            globalStyles.teamStyles.message,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}
        >
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
