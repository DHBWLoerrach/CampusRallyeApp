import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import * as Progress from 'react-native-progress';
import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from './utils/Supabase';
import RallyeScreen from './screens/RallyeScreen';
import SettingsScreen from './screens/SettingsScreen';
import TeamScreen from './screens/TeamScreen';
import ImprintScreen from './screens/ImprintScreen';
import InformationScreen from './screens/InformationScreen';
import SkillQuestions from './screens/questions/SkillQuestions';
import UploadQuestions from './screens/questions/UploadQuestions';
import QRCodeQuestions from './screens/questions/QRCodeQuestions';
import Color from './utils/Colors';
import { useSharedStates } from './utils/SharedStates';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const {
    rallye,
    setRallye,
    team,
    currentQuestion,
    questions,
    remainingTime,
    setRemainingTime,
  } = useSharedStates();
  const [percentage, setPercentage] = useState(0.0);

  useEffect(() => {
    if (!rallye) {
      return;
    }
    const intervalId = setInterval(() => {
      const endTime = new Date(rallye.end_time);
      const currentTime = new Date();
      const diffInMilliseconds = endTime - currentTime;
      const diffInMinutes = Math.round(
        diffInMilliseconds / 1000 / 60
      );
      setRemainingTime(diffInMinutes);
    }, 60000);

    //execute it one time to set the time directly
    const endTime = new Date(rallye.end_time);
    const currentTime = new Date();
    const diffInMilliseconds = endTime - currentTime;
    const diffInMinutes = Math.round(diffInMilliseconds / 1000 / 60);
    setRemainingTime(diffInMinutes);

    return () => clearInterval(intervalId);
  }, []);

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
        tabBarIcon: ({ focused, size }) => {
          let iconName;
          if (route.name === 'rallye') {
            iconName = 'map';
          } else if (route.name === 'settings') {
            iconName = 'settings';
          } else if (route.name === 'team') {
            iconName = 'people';
          }
          return (
            <MaterialIcon
              name={iconName}
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
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
          title: 'Team',
        }}
      />
      <Tab.Screen
        name="rallye"
        component={RallyeScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
          headerTitle: () =>
            rallye ? (
              rallye.status === 'running' && remainingTime > 0 ? (
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 14,
                      fontWeight: '500',
                    }}
                  >
                    Verbleibende Zeit: {remainingTime} Minuten
                  </Text>
                  <Progress.Bar
                    style={{ marginTop: 10 }}
                    progress={percentage}
                    color="white"
                  />
                </View>
              ) : rallye.status === 'post_processing' ? (
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 18,
                      fontWeight: '500',
                    }}
                  >
                    Abstimmung
                  </Text>
                </View>
              ) : rallye.status === 'pre_processing' ? (
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 18,
                      fontWeight: '500',
                    }}
                  >
                    Vorbereitungen
                  </Text>
                </View>
              ) : rallye.status === 'ended' ? (
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 18,
                      fontWeight: '500',
                    }}
                  >
                    Beendet
                  </Text>
                </View>
              ) : null
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Progress.Bar
                  style={{ marginTop: 10 }}
                  progress={percentage}
                  color="white"
                />
              </View>
            ),
          title: 'Campus Rallye',
        }}
      />
      <Tab.Screen
        name="settings"
        component={SettingsScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
          title: 'Einstellungen',
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Rallye"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Impressum"
        component={ImprintScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
      <Stack.Screen
        name="Informationen"
        component={InformationScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
      <Stack.Screen
        name="Wissensfragen"
        component={SkillQuestions}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
      <Stack.Screen
        name="ImageQuestions"
        component={UploadQuestions}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
      <Stack.Screen
        name="QRCodeQuestions"
        component={QRCodeQuestions}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
    </Stack.Navigator>
  );
}
