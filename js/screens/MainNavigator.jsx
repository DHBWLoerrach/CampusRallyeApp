import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import ImpressumScreen from '../pages/pagesOnSettingsScreen/ImpressumScreen';
import InformationenScreen from '../pages/pagesOnSettingsScreen/InformationenScreen';
import QRCodeFragen from '../pages/questions/QRCodeFragen';
import Wissensfragen from '../pages/questions/Wissensfragen';
import BildFragen from '../pages/questions/BildFragen';
import QRScan from '../pages/questions/QRScan';
import RallyeScreen from '../pages/RallyeScreen';
import SettingsScreen from '../pages/SettingsScreen';
import GroupScreen from '../pages/GroupScreen';
import Color from '../styles/Colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabScreen(props) {
  const { confirmedGroup, confirmedGroupMembers } = props;
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
              size={size}
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
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      >
        {(props) => (
          <GroupScreen
            {...props}
            confirmedGroup={confirmedGroup}
            confirmedGroupMembers={confirmedGroupMembers}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="DHBW Campus Rallye"
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      >
        {(props) => (
          <RallyeScreen
            {...props}
            confirmedGroup={confirmedGroup}
            confirmedGroupMembers={confirmedGroupMembers}
          />
        )}
      </Tab.Screen>
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

export default function MainNavigator({
  confirmedGroup,
  confirmedGroupMembers,
}) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Rallye" options={{ headerShown: false }}>
        {(props) => (
          <TabScreen
            {...props}
            confirmedGroup={confirmedGroup}
            confirmedGroupMembers={confirmedGroupMembers}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Impressum"
        component={ImpressumScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
      <Stack.Screen
        name="Informationen"
        component={InformationenScreen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
      <Stack.Screen
        name="Wissensfragen"
        component={Wissensfragen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
      <Stack.Screen
        name="QRCodeFragen"
        component={QRCodeFragen}
        options={{
          headerStyle: { backgroundColor: Color.dhbwRed },
          headerTintColor: Color.tabHeader,
        }}
      />
      <Stack.Screen
        name="BildFragen"
        component={BildFragen}
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
