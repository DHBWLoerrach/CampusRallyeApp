import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import * as Progress from 'react-native-progress';
import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from './utils/Supabase';

import RallyeScreen from './screens/RallyeScreen';
import SettingsScreen from './screens/SettingsScreen';
import GroupScreen from './screens/GroupScreen';
import ImprintScreen from './screens/ImprintScreen';
import InformationScreen from './screens/InformationScreen';
import SkillQuestions from './screens/questions/SkillQuestions';
import ImageQuestions from './screens/questions/ImageQuestions';
import QRCodeQuestions from './screens/questions/QRCodeQuestions';
import QRScan from './screens/questions/QRScan';
import Color from './utils/Colors';
import { useSharedStates } from './utils/SharedStates';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { setRallye, rallye } = useSharedStates();
  const { useRallye, group } = useSharedStates();
  const { currentQuestion, questions } = useSharedStates();
  const [percentage, setPercentage] = useState(0.0);

  if (useRallye) {
    useEffect(() => {
      const fetchData = async () => {
        const { data: rallye } = await supabase
          .from('rallye')
          .select('*')
          .eq('is_active_rallye', true);

        setRallye(rallye[0]);
      };
      fetchData();
    }, []);

    useEffect(() => {
      const fetchData = async () => {
        let groupid = group;
        let { data, error } = await supabase.rpc(
          'get_question_count',
          {
            groupid,
          }
        );
        value =
          parseFloat(data[0].answeredquestions) /
          parseFloat(data[0].totalquestions);
        setPercentage(value);
      };
      if (group !== null) {
        fetchData();
      }
    }, [currentQuestion, group]);
  }

  return (
    <Tab.Navigator
      initialRouteName={useRallye ? 'group' : 'rallye'}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName;

          if (route.name === 'rallye') {
            iconName = 'map';
          } else if (route.name === 'settings') {
            iconName = 'settings';
          } else if (route.name === 'group') {
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
        name="group"
        component={GroupScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
          title: 'Gruppe',
        }}
      />
      <Tab.Screen
        name="rallye"
        component={RallyeScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
          headerTitle: () => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: 'white' }}>
                Campus Rallye DHBW Lörrach
              </Text>
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
        component={ImageQuestions}
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
      <Stack.Screen
        name="QRScan"
        component={QRScan}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
    </Stack.Navigator>
  );
}
