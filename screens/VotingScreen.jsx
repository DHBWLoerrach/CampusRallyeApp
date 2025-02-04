import { useState, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { store$ } from "../services/storage/Store";
import { supabase } from "../utils/Supabase";
import UIButton from "../ui/UIButton";
import Colors from "../utils/Colors";
import { globalStyles } from "../utils/GlobalStyles";

export default function VotingScreen({ onRefresh, loading }) {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [voting, setVoting] = useState([]);
  const [currentVoting, setCurrentVoting] = useState(0);
  const [sendingResult, setSendingResult] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();

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

  const handleNextQuestion = async () => {
    setSendingResult(true);
    await supabase.from("question_voting").insert([
      {
        question_id: voting[currentVoting]?.id,
        group_id: team.id,
        voted_group_id: selectedTeam,
      },
    ]);
    setCurrentVoting(currentVoting + 1);
    setSelectedTeam(null);
    setSendingResult(false);
  };

  if (teams.length < 2 || !voting[currentVoting]) {
    return (
      <ScrollView
        contentContainerStyle={[
          globalStyles.default.refreshContainer,
          globalStyles.rallyeStatesStyles.container,
        ]}
        style={{ backgroundColor: "white" }}
      >
        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
            Die Abstimmung wurde beendet
          </Text>
          <Text style={globalStyles.rallyeStatesStyles.infoSubtitle}>
            Lade diese Seite neu, um das Ergebnis zu sehen, nachdem die Rallye
            beendet wurde.
          </Text>
        </View>

        <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
          Aktualisieren
        </UIButton>
      </ScrollView>
    );
  }

  return (
    <ScrollView
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
            Gebt dem Team einen zusätzlichen Punkt, das eurer Meinung nach die
            oben gestellte Aufgabe am besten gelöst hat.
          </Text>
        </View>

        {teams
          ?.filter((item) => item.id !== team.id)
          .map((item, index) => (
            <View
              key={index}
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
              <UIButton
                color={
                  selectedTeam === item.id ? Colors.dhbwRed : Colors.dhbwGray
                }
                outline={true}
                onPress={() => setSelectedTeam(item.id)}
              >
                Punkt vergeben
              </UIButton>
            </View>
          ))}

        <View style={globalStyles.rallyeStatesStyles.infoBox}>
          <UIButton
            disabled={!selectedTeam || sendingResult}
            onPress={handleNextQuestion}
          >
            Nächste Abstimmung
          </UIButton>
        </View>
      </View>
    </ScrollView>
  );
}
