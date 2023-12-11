import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import * as Progress from 'react-native-progress';
import { View, Text } from 'react-native';

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName;

          if (route.name === 'DHBW Campus Rallye') {
            iconName = 'map';
          } else if (route.name === 'Einstellungen') {
            iconName = 'settings';
          } else if (route.name === 'Gruppe') {
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
        name="Gruppe"
        component={GroupScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
      <Tab.Screen
        name="DHBW Campus Rallye"
        component={RallyeScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text>Rallye</Text>
            <Progress.Bar progress={0.3} width={200} />
          </View>
            ),
        }}
      />
      <Tab.Screen
        name="Einstellungen"
        component={SettingsScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
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
    // headerStyle: { backgroundColor: Color.dhbwRed },
    // headerTintColor: Color.tabHeader,
    // headerTitle: () => (
    //   <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    //     <Text style={{color: Color.tabHeader}}>Wissensfragen</Text>
    //     <ProgressBar progress={0.5} color={Color.tabHeader} />
    //   </View>
    // ),
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
