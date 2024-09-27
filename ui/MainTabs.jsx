import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import * as Progress from 'react-native-progress';
import { observer } from '@legendapp/state/react';
import { currentTime } from '@legendapp/state/helpers/time';
import { supabase } from '../utils/Supabase';
import { store$ } from '../utils/Store';
import TimeHeader from './TimeHeader';
import RallyeScreen from '../screens/RallyeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TeamScreen from '../screens/TeamScreen';
import Color from '../utils/Colors';
import { useSharedStates } from '../utils/SharedStates';

const Tab = createBottomTabNavigator();

const RallyeHeader = observer(function RallyeHeader({
  rallye,
  percentage,
}) {
  const currentTime$ = currentTime.get();

  return (
    <View style={{ alignItems: 'center' }}>
      {rallye ? (
        rallye.status === 'running' &&
        currentTime$ < rallye.end_time ? (
          <>
            <TimeHeader endTime={rallye.end_time} />
            <Progress.Bar
              style={{ marginTop: 10 }}
              progress={percentage}
              color="white"
            />
          </>
        ) : (
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '500',
            }}
          >
            {rallye.status === 'pre_processing' && 'Vorbereitungen'}
            {rallye.status === 'post_processing' && 'Abstimmung'}
            {rallye.status === 'running' && 'Zeit abgelaufen'}
            {rallye.status === 'ended' && 'Beendet'}
          </Text>
        )
      ) : (
        <Progress.Bar
          style={{ marginTop: 10 }}
          progress={percentage}
          color="white"
        />
      )}
    </View>
  );
});

const MainTabs = function MainTabs() {
  const { team, currentQuestion, questions } = useSharedStates();
  const [percentage, setPercentage] = useState(0.0);
  const rallye = store$.rallye.get();

  useEffect(() => {
    if (rallye) {
      const fetchData = async () => {
        let { data, error } = await supabase.rpc(
          'get_question_count',
          {
            groupid: team,
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
};

export default MainTabs;
