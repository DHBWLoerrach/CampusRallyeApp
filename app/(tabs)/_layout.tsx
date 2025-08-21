import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

const ICON_SIZE = 28;

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rallye',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="infos"
        options={{
          title: 'Informationen',
          tabBarLabel: 'Infos',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="info.circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
