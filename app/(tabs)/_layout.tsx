import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import RallyeHeader from '@/components/rallye/RallyeHeader';
import RallyeHeaderActions from '@/components/rallye/RallyeHeaderActions';

const ICON_SIZE = 28;

export default function TabLayout() {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  return (
    <Tabs
      initialRouteName="rallye"
      screenOptions={{
        headerLeft: () => <RallyeHeader />,
        headerTitle: () => null,
        headerRight: () => <RallyeHeaderActions />,
        headerStyle: { backgroundColor: palette.surface1 },
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
        headerRightContainerStyle: {
          paddingRight: 8,
        },
        headerTitleStyle: { color: palette.text },
        headerTintColor: palette.text,
        tabBarStyle: {
          backgroundColor: palette.surface1,
          borderTopColor: palette.borderSubtle,
        },
        tabBarActiveTintColor: Colors.dhbwRed,
        tabBarInactiveTintColor: palette.tabBarIcon,
      }}
    >
      <Tabs.Screen
        name="rallye"
        options={{
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
