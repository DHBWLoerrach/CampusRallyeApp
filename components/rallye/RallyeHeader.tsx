import { View, useWindowDimensions } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { useTheme } from '@/utils/ThemeContext';
import Colors from '@/utils/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ThemedText from '@/components/themed/ThemedText';

export default function RallyeHeader() {
  const { isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const team = useSelector(() => store$.team.get());
  const hasTeamName = !!team?.name;
  const headerWidth = Math.max(width - 220, 96);

  if (!hasTeamName) return null;

  return (
    <View
      style={{
        width: headerWidth,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <IconSymbol name="person.3" size={16} color={palette.text} />
      <ThemedText
        variant="label"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ flexShrink: 1, flexGrow: 1 }}
      >
        {team.name}
      </ThemedText>
    </View>
  );
}
