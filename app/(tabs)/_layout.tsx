import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import LogoutButton from '@/components/ui/LogoutButton';

const ICON_SIZE = 28;

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="rallye"
      screenOptions={{
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tabs.Screen
        name="rallye"
        options={{
          title: 'Rallye',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="map" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="infos"
        options={{
          title: 'Informationen',
          tabBarLabel: 'Infos',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol name="info.circle" size={ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
