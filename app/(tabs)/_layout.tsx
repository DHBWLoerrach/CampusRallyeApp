import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { store$ } from '@/services/storage/Store';

const ICON_SIZE = 28;

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      initialRouteName="rallye"
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity
            onPress={() => {
              store$.enabled.set(false);
            }}
            accessibilityLabel="Logout"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ paddingHorizontal: 8 }}
          >
            <IconSymbol
              name="rectangle.portrait.and.arrow.right"
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="rallye"
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
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="info.circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
