import { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { observer } from '@legendapp/state/react';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/Supabase';
import { store$ } from '../utils/Store';
import RallyeHeader from './RallyeHeader';
import RallyeScreen from '../screens/RallyeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TeamScreen from '../screens/TeamScreen';
import Color from '../utils/Colors';
import { useSharedStates } from '../utils/SharedStates';

const Tab = createBottomTabNavigator();

const MainTabs = observer(function MainTabs() {
  const { currentQuestion, questions } = useSharedStates();
  const [percentage, setPercentage] = useState(0.0);
  const rallye = store$.rallye.get();
  const team = store$.team.get();

  useEffect(() => {
    if (rallye && team) {
      const fetchData = async () => {
        let { data, error } = await supabase.rpc(
          'get_question_count',
          {
            groupid: team.id,
          }
        );
        let value =
          parseFloat(data[0].answeredquestions) /
          parseFloat(data[0].totalquestions);
        setPercentage(value);
      };
      if (team !== null) {
        fetchData();
      }
    } else {
      let value = 0.0;
      if (currentQuestion && questions != null) {
        value =
          parseFloat(currentQuestion) / parseFloat(questions.length);
      }

      setPercentage(value);
    }
  }, [currentQuestion, team]);

  return (
    <Tab.Navigator
      initialRouteName={rallye ? 'team' : 'rallye'}
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: Color.dhbwRed },
        headerTintColor: Color.tabHeader,
        tabBarIcon: ({ focused }) => {
          const icons = {
            rallye: 'map',
            settings: 'settings',
            team: 'people',
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
        name="team"
        component={TeamScreen}
        options={{ title: 'Team' }}
      />
      <Tab.Screen
        name="rallye"
        component={RallyeScreen}
        options={{
          headerTitle: () => (
            <RallyeHeader rallye={rallye} percentage={percentage} />
          ),
        }}
      />
      <Tab.Screen
        name="settings"
        component={SettingsScreen}
        options={{ title: 'Einstellungen' }}
      />
    </Tab.Navigator>
  );
});

export default MainTabs;
