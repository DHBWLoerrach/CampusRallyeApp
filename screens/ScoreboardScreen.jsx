import { useState, useEffect, useContext } from "react";
import { ScrollView, Text, View } from "react-native";
import { store$ } from "../services/storage/Store";
import { supabase } from "../utils/Supabase";
import { globalStyles } from "../utils/GlobalStyles";
import UIButton from "../ui/UIButton";
import Colors from "../utils/Colors";
import { ThemeContext } from "../utils/ThemeContext";
import { useLanguage } from "../utils/LanguageContext"; // Import LanguageContext

export default function ScoreboardScreen() {
  const rallye = store$.rallye.get();
  const ourTeam = store$.team.get();
  const points = store$.points.get();
  const [sortedTeams, setSortedTeams] = useState([]);
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  useEffect(() => {
    if (rallye.status !== "ended") return;
    const fetchData = async () => {
      try {
        let { data } = await supabase
          .from("rallye_team")
          .select("id, name, created_at, time_played")
          .eq("rallye_id", rallye.id);


        const { data: teamPoints, error } = await supabase
          .from("team_questions")
          .select("team_id, points")
          .in(
            "team_id",
            data.map((team) => team.id)
          );


        if (error) throw error;

        data = data.map((team) => {
          const totalTeamPoints = teamPoints.filter(
            (points) => points.team_id === team.id
          );
          team.total_points = totalTeamPoints.reduce(
            (acc, curr) => acc + curr.points,
            0
          );
          return team;
        });

        if (data) {
          // Calculate time spent for each team
          data = data.map((team) => {
            const startTime = new Date(team.created_at).getTime();
            const endTime = new Date(team.time_played).getTime();
            team.time_spent = endTime - startTime; // in milliseconds
            return team;
          });

          // Sort by points (descending) and then by time spent (ascending) if points are equal
          data.sort((a, b) => {
            if (b.total_points !== a.total_points) {
              return b.total_points - a.total_points;
            }
            return a.time_spent - b.time_spent; // Less time is better
          });

          let rank = 1;
          let previousPoints = data[0]?.total_points;
          let previousTime = data[0]?.time_spent;

          const rankedData = data.map((team, index) => {
            if (index > 0) {
              // Only change rank if points are different or both points and time are different
              if (previousPoints !== team.total_points) {
                rank = index + 1;
              }
            }
            previousPoints = team.total_points;
            previousTime = team.time_spent;
            return {
              ...team,
              rank: rank,
              group_name: team.name, // Map name to group_name for display
            };
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
        { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
      ]}
    >
      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          {language === 'de' ? 'Punktestand' : 'Scoreboard'}
        </Text>
        {ourTeam && (
          <Text
            style={[
              globalStyles.rallyeStatesStyles.infoSubtitle,
              { marginTop: 10, color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
            ]}
          >
            {language === 'de' ? 'Dein Team:' : 'Your Team:'} {ourTeam.name}
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
          <Text style={[globalStyles.scoreboardStyles.headerCell, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
            {language === 'de' ? 'Platz' : 'Rank'}
          </Text>
          <Text style={[globalStyles.scoreboardStyles.headerCellWide, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
            {language === 'de' ? 'Team' : 'Team'}
          </Text>
          <Text style={[globalStyles.scoreboardStyles.headerCell, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
            {language === 'de' ? 'Punkte' : 'Points'}
          </Text>
        </View>

        {/* ScrollView für die Teamliste */}
        <ScrollView style={[{ maxHeight: 300 }, { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.veryLightGray }]}>
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
          {language === 'de' ? 'Rallye beenden' : 'Quit Rallye'}
        </UIButton>
      </View>
    </ScrollView>
  );
}
