import { useState } from "react";
import { Alert, TouchableOpacity } from "react-native";
import { store$ } from "../services/storage/Store";
import { MaterialIcons } from "@expo/vector-icons";
import { globalStyles } from "../utils/GlobalStyles";

export default function Hint({ hint }) {
  const [showHint, setShowHint] = useState(false);
  const currentQuestion = store$.currentQuestion.get();

  const handleHint = () => {
    if (!showHint) {
      Alert.alert(
        "Sicherheitsfrage",
        `Seid ihr sicher, dass ihr einen Tipp erhalten möchtet? Das kostet euch ein paar Punkte.`,
        [
          {
            text: "Abbrechen",
            style: "cancel",
          },
          {
            text: "Ja, ich möchte einen Tipp",
            onPress: () => {
              setShowHint(true);
              currentQuestion.points -= 1;
              Alert.alert("Tipp", hint);
            },
          },
        ]
      );
    } else {
      Alert.alert("Tipp", hint);
    }
  };

  return (
    <TouchableOpacity style={globalStyles.fab} onPress={handleHint}>
      <MaterialIcons name="lightbulb-outline" size={24} color="white" />
    </TouchableOpacity>
  );
}
