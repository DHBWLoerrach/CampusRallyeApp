import { useState, useEffect, useContext } from "react";
import { View, Text, FlatList } from "react-native";
import { store$ } from "../services/storage/Store";
import { supabase } from "../utils/Supabase";
import UIButton from "../ui/UIButton";
import Colors from "../utils/Colors";
import { globalStyles } from "../utils/GlobalStyles";
import { ThemeContext } from "../utils/ThemeContext";
import { useLanguage } from "../utils/LanguageContext"; // Import LanguageContext
import { TouchableOpacity } from "react-native";

export default function VotingScreen({ onRefresh, loading }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [voting, setVoting] = useState([]);
  const [teamCount, setTeamCount] = useState(0);
  const [counter, setCounter] = useState(0);
  const [selectedUpdateId, setSelectedUpdateId] = useState(null);
  const [sortedContent, setSortedContent] = useState([]);
  const [currentVotingIdx, setCurrentVotingIdx] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sendingResult, setSendingResult] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  useEffect(() => {
    const fetchDataSupabase = async () => {
      const { data: teams } = await supabase
        .from("rallye_group")
        .select("*")
        .eq("rallye_id", rallye.id)
        .order("id", { ascending: false });
      setTeams(teams);
      const { data: vote } = await supabase.rpc("get_unvoted_questions", {
        input_group_id: team.id,
      });
      if (vote !== null) {
        setVoting(vote);
      }
    };
    fetchDataSupabase();
  }, []);

  useEffect(() => {
    const sorted = voting.sort((a, b) => a.tq_question_id - b.tq_question_id);

    let result = [];
    let current = null;
    for (let i = 0; i < sorted.length; i++) {
      if (current !== sorted[i].tq_question_id) {
        current = sorted[i].tq_question_id;
        result.push([]);
      }
      result[result.length - 1].push(sorted[i]);
    }
    setSortedContent(result);

    if (counter > currentVotingIdx) {
      store$.votingAllowed.set(true);
      const currentQ = sortedContent[currentVotingIdx];
      setCurrentQuestion(currentQ);
    } else {
      store$.votingAllowed.set(false);
    }
  }, [currentVotingIdx, counter, voting]);

  const handleNextQuestion = async () => {
    // Update der Punkte
    const { data, error } = await supabase.rpc(
      "increment_team_question_points", {
        target_answer_id: selectedUpdateId,
      }
    );
    if (error) {
      console.error("Error updating team question:", error);
      return;
    }

    setCurrentVotingIdx(currentVotingIdx + 1);
    setSelectedUpdateId(null);
    setSelectedTeam(null);
    setSendingResult(false);
  };

  if (!votingAllowed || teamCount < 2) {
    return (
      <View
        contentContainerStyle={[
          globalStyles.default.refreshContainer,
          globalStyles.rallyeStatesStyles.container,
        ]}
        style={{ backgroundColor: "white" }}
      >
        <View style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
        ]}>
          <Text style={[
            globalStyles.rallyeStatesStyles.infoTitle,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}>
            {language === 'de' ? 'Die Abstimmung wurde beendet' : 'The voting has ended'}
          </Text>
          <Text style={[
            globalStyles.rallyeStatesStyles.infoSubtitle,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}>
            {language === 'de' ? 'Lade diese Seite neu, um das Ergebnis zu sehen, nachdem die Rallye beendet wurde.' : 'Reload this page to see the result after the rally has ended.'}
          </Text>
        </View>
        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
            {language === 'de' ? 'Aktualisieren' : 'Refresh'}
          </UIButton>
        </View>
      </View>
    );
  }

  return (
    <View
      contentContainerStyle={globalStyles.default.refreshContainer}
      style={{ backgroundColor: "white" }}
    >
      <View style={globalStyles.default.container}>
        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
            {voting[currentVoting]?.question}
          </Text>
          <Text
            style={[
              globalStyles.rallyeStatesStyles.infoSubtitle,
              { color: Colors.dhbwRed, marginTop: 20 },
            ]}
          >
            {language === 'de' ? 'Gebt dem Team einen zusätzlichen Punkt, das eurer Meinung nach die oben gestellte Aufgabe am besten gelöst hat.' : 'Give an extra point to the team that you think solved the task above the best.'}
          </Text>
        </View>

        {teams
          ?.filter((item) => item.id !== team.id)
          .map((item, index) => (
            <View
              style={[
                globalStyles.rallyeStatesStyles.infoBox,
                {
                  borderColor:
                    selectedTeam === item.id ? Colors.dhbwRed : "transparent",
                  borderWidth: selectedTeam === item.id ? 2 : 0,
                },
              ]}
            >
              <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
                {item.name}
              </Text>
            </View>
          ))}

        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <UIButton
            disabled={!selectedTeam || sendingResult}
            onPress={handleNextQuestion}
          >
            {language === 'de' ? 'Nächste Abstimmung' : 'Next Vote'}
          </UIButton>
        </View>
      </View>
    </View>
  );
}
