import { NativeTabs } from 'expo-router/unstable-native-tabs';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';

export default function TabLayout() {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  return (
    <NativeTabs
      backgroundColor={palette.surface1}
      iconColor={{ default: palette.tabBarIcon, selected: Colors.dhbwRed }}
      labelStyle={{
        default: { color: palette.tabBarIcon },
        selected: { color: Colors.dhbwRed },
      }}
      minimizeBehavior="onScrollDown"
      shadowColor={palette.borderSubtle}
      tintColor={Colors.dhbwRed}
    >
      <NativeTabs.Trigger name="rallye">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'map', selected: 'map.fill' }}
          md="map"
        />
        <NativeTabs.Trigger.Label>Rallye</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="infos">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'info.circle', selected: 'info.circle.fill' }}
          md="info"
        />
        <NativeTabs.Trigger.Label>Infos</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
