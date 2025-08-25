import { View, Text } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import TimerHeader from '@/components/rallye/TimerHeader';

export default function RallyeHeader() {
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
        <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
          {progressText}
        </Text>
      ) : null}
    </View>
  );
}

