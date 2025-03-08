import { useState, useEffect, useContext } from "react";
import { ScrollView, Text, View } from "react-native";
import { store$ } from "../services/storage/Store";
import { supabase } from "../utils/Supabase";
import { globalStyles } from "../utils/GlobalStyles";
import UIButton from "../ui/UIButton";
import Colors from "../utils/Colors";
import { ThemeContext } from "../utils/ThemeContext";

export default function ScoreboardScreen() {
  const rallye = store$.rallye.get();
  const ourTeam = store$.team.get();
  const points = store$.points.get();
  const [sortedTeams, setSortedTeams] = useState([]);
  const { isDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    if (rallye.status !== "ended") return;
    const fetchData = async () => {
      try {
        let { data } = await supabase.rpc("get_total_points_per_rallye", {
          rallye_id_param: rallye.id,
        });

        if (data) {
          data.sort((a, b) => b.total_points - a.total_points);

          let rank = 1;
          let previousPoints = data[0].total_points;

          const rankedData = data.map((team) => {
            if (previousPoints !== team.total_points) rank += 1;
            previousPoints = team.total_points;
            return { ...team, rank: rank };
          });

          setSortedTeams(rankedData);
        }
      } catch (error) {
        console.error("Error fetching total points data:", error);
      }
    };
    fetchData();
  }, [rallye]);

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
      ]}
      style={{ backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }}
    >
      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Punktestand
        </Text>
        {ourTeam && (
          <Text
            style={[
              globalStyles.rallyeStatesStyles.infoSubtitle,
              { marginTop: 10, color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
            ]}
          >
            Dein Team: {ourTeam.name}
          </Text>
        )}
      </View>

      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { padding: 0, backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <View
          style={{
            flexDirection: "row",
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? Colors.darkMode.cellBorder : Colors.lightMode.cellBorder,
            backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.veryLightGray,
          }}
        >
          <Text style={globalStyles.scoreboardStyles.headerCell}>Platz</Text>
          <Text style={globalStyles.scoreboardStyles.headerCellWide}>Team</Text>
          <Text style={globalStyles.scoreboardStyles.headerCell}>Punkte</Text>
        </View>

        {/* ScrollView für die Teamliste */}
        <ScrollView style={{ maxHeight: 300 }}>
          {sortedTeams.map((team, index) => (
            <View
              key={index}
              style={[
                globalStyles.scoreboardStyles.row,
                team.group_name === ourTeam?.name &&
                  globalStyles.scoreboardStyles.rowHighlighted,
                { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
              ]}
            >
              <Text style={[
                globalStyles.scoreboardStyles.cell,
                { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
              ]}>
                {team.rank}
              </Text>
              <Text
                style={[
                  globalStyles.scoreboardStyles.cellWide,
                  team.group_name === ourTeam?.name &&
                    globalStyles.scoreboardStyles.cellHighlighted,
                  { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
                ]}
              >
                {team.group_name}
              </Text>
              <Text style={[
                globalStyles.scoreboardStyles.cell,
                { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
              ]}>
                {team.total_points}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <UIButton icon="arrow-left" onPress={() => store$.enabled.set(false)}>
          Zurück zur Anmeldung
        </UIButton>
      </View>
    </ScrollView>
  );
}
