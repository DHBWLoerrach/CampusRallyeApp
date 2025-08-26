import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import LogoutButton from '@/components/ui/LogoutButton';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import RallyeHeader from '@/components/rallye/RallyeHeader';

const ICON_SIZE = 28;

export default function TabLayout() {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  return (
    <Tabs
      initialRouteName="rallye"
      screenOptions={{
        headerRight: () => <LogoutButton />,
        headerStyle: { backgroundColor: palette.background },
        headerTitleStyle: { color: palette.text },
        headerTintColor: palette.text,
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.cellBorder,
        },
        tabBarActiveTintColor: Colors.dhbwRed,
        tabBarInactiveTintColor: palette.tabBarIcon,
      }}
    >
      <Tabs.Screen
        name="rallye"
        options={{
          headerTitle: () => <RallyeHeader />,
          tabBarLabel: 'Rallye',
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
