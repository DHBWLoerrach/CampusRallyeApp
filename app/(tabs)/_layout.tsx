import { Tabs } from 'expo-router';

const ICON_SIZE = 28;

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Zuhause',
          tabBarLabel: 'Heim',
        }}
      />
      <Tabs.Screen
        name="imprint"
        options={{
          title: 'Impressum',
          tabBarLabel: 'Impressum',
        }}
      />
      <Tabs.Screen
        name="information"
        options={{
          title: 'Informationen',
        }}
      />
    </Tabs>
  );
}
