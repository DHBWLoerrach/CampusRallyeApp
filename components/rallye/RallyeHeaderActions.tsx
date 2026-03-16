import { View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import TimerHeader from '@/components/rallye/TimerHeader';
import LogoutButton from '@/components/ui/LogoutButton';

export default function RallyeHeaderActions() {
  const rallye = useSelector(() => store$.rallye.get());
  const isTourMode = useSelector(() => store$.isTourMode.get());
  const showTimer = rallye?.status === 'running' && !isTourMode;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {showTimer ? <TimerHeader endTime={rallye?.end_time} /> : null}
      <LogoutButton />
    </View>
  );
}
