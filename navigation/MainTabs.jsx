import { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { observer } from "@legendapp/state/react";
import MaterialIcon from "@expo/vector-icons/MaterialIcons";
import { supabase } from "../utils/Supabase";
import { store$ } from "../services/storage/Store";
import RallyeHeader from "./RallyeHeader";
import RallyeScreen from "../screens/RallyeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import TeamScreen from "../screens/TeamScreen";
import Color from "../utils/Colors";

const Tab = createBottomTabNavigator();

const MainTabs = observer(function MainTabs() {
  const [percentage, setPercentage] = useState(0.0);
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const questions = store$.questions.get();
  const currentQuestion = store$.currentQuestion.get();
  const allQuestionsAnswered = store$.allQuestionsAnswered.get();
  const index = store$.questionIndex.get();

  useEffect(() => {
    if (rallye && team) {
      const fetchData = async () => {
        let { data, error } = await supabase.rpc("get_question_count", {
          groupid: team.id,
        });
        let value =
          parseFloat(data[0].answeredquestions) /
          parseFloat(data[0].totalquestions);
        setPercentage(value);
      };
      if (team !== null) {
        fetchData();
      }
    } else if (questions.length > 0) {
      let value = allQuestionsAnswered
        ? 1.0
        : parseFloat(index) / parseFloat(questions.length);
      setPercentage(value);
    }
  }, [currentQuestion, team, allQuestionsAnswered]);

  const HomeScreen = () => {
    useEffect(() => {
      store$.enabled.set(false);
    }, []);

    return null;
  };

  return (
    <Tab.Navigator
      initialRouteName={rallye && rallye.status === "running" ? "team" : "rallye"}
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: Color.dhbwRed },
        headerTintColor: Color.tabHeader,
        tabBarIcon: ({ focused }) => {
          const icons = {
            home: "home",
            rallye: "map",
            settings: "settings",
            team: "people",
          };
          return (
            <MaterialIcon
              name={icons[route.name]}
              size={30}
              color={focused ? Color.dhbwRed : Color.dhbwGray}
            />
          );
        },
        tabBarActiveTintColor: Color.dhbwRed,
        tabBarInactiveTintColor: Color.dhbwGray,
      })}
    >
      <Tab.Screen
        name="home"
        component={HomeScreen}
        options={{ title: "Anmeldung" }}
      />
      <Tab.Screen
        name="team"
        component={TeamScreen}
        options={{ title: "Team" }}
      />
      <Tab.Screen
        name="rallye"
        component={RallyeScreen}
        options={{
          title: "Rallye",
          headerTitle: () => (
            <RallyeHeader rallye={rallye} percentage={percentage} />
          ),
        }}
      />
      <Tab.Screen
        name="settings"
        component={SettingsScreen}
        options={{ title: "Einstellungen" }}
      />
    </Tab.Navigator>
  );
});

export default MainTabs;
