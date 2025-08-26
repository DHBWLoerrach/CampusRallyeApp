import { View, Text } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import TimerHeader from '@/components/rallye/TimerHeader';
import { useTheme } from '@/utils/ThemeContext';
import Colors from '@/utils/Colors';

export default function RallyeHeader() {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const rallye = useSelector(() => store$.rallye.get());
  const idx = useSelector(() => store$.questionIndex.get());
  const qsLen = useSelector(() => store$.questions.get().length);
  const allAnswered = useSelector(() => store$.allQuestionsAnswered.get());

  const showTimer = rallye?.status === 'running' && !rallye?.tour_mode;
  const progressText = qsLen > 0 && !allAnswered ? `${idx + 1}/${qsLen}` : '';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {showTimer && <TimerHeader endTime={rallye?.end_time} />}
      {progressText ? (
        <Text style={{ color: palette.text, fontSize: 14, fontWeight: '500' }}>
          {progressText}
        </Text>
      ) : null}
    </View>
  );
}
