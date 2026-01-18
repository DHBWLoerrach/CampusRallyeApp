import { View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import TimerHeader from '@/components/rallye/TimerHeader';
import { useTheme } from '@/utils/ThemeContext';
import Colors from '@/utils/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ThemedText from '@/components/themed/ThemedText';

export default function RallyeHeader() {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const rallye = useSelector(() => store$.rallye.get());
  const team = useSelector(() => store$.team.get());

  const showTimer = rallye?.status === 'running' && !rallye?.tour_mode;

  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
      }}
    >
      {team?.name && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <IconSymbol name="person.3" size={16} color={palette.text} />
          <ThemedText variant="label">{team.name}</ThemedText>
        </View>
      )}
      <View>{showTimer && <TimerHeader endTime={rallye?.end_time} />}</View>
    </View>
  );
}
