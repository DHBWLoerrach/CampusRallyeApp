import { View, Text } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import TimerHeader from '@/components/rallye/TimerHeader';
import { useTheme } from '@/utils/ThemeContext';
import Colors from '@/utils/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function RallyeHeader() {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const rallye = useSelector(() => store$.rallye.get());
  const team = useSelector(() => store$.team.get());
  const idx = useSelector(() => store$.questionIndex.get());
  const qsLen = useSelector(() => store$.questions.get().length);
  const allAnswered = useSelector(() => store$.allQuestionsAnswered.get());

  const showTimer = rallye?.status === 'running' && !rallye?.tour_mode;
  const progressText = qsLen > 0 && !allAnswered ? `${idx + 1}/${qsLen}` : '';

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: Team */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {showTimer && team?.name ? (
          <>
            <IconSymbol name="person.3" size={16} color={palette.text} />
            <Text style={{ color: palette.text, fontSize: 14, fontWeight: '500' }}>
              {team.name}
            </Text>
          </>
        ) : null}
      </View>

      {/* Right: Timer */}
      <View>{showTimer && <TimerHeader endTime={rallye?.end_time} />}</View>
    </View>
  );
}
