import { View, Text } from 'react-native';
import * as Progress from 'react-native-progress';
import { observer } from '@legendapp/state/react';
import { currentTime } from '@legendapp/state/helpers/time';
import TimeHeader from './TimeHeader';

const RallyeHeader = observer(function RallyeHeader({
  rallye,
  percentage,
}) {
  const currentTime$ = currentTime.get();

  const ProgressBar = () => (
    <Progress.Bar
      style={{ marginTop: 10 }}
      progress={percentage}
      color="white"
    />
  );

  return (
    <View style={{ alignItems: 'center' }}>
      {rallye ? (
        rallye.status === 'running' &&
        currentTime$ < rallye.end_time ? (
          <>
            <TimeHeader endTime={rallye.end_time} />
            <ProgressBar />
          </>
        ) : (
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '500',
            }}
          >
            {rallye.status === 'pre_processing' && 'Vorbereitungen'}
            {rallye.status === 'post_processing' && 'Abstimmung'}
            {rallye.status === 'running' && 'Zeit abgelaufen'}
            {rallye.status === 'ended' && 'Beendet'}
          </Text>
        )
      ) : (
        <ProgressBar />
      )}
    </View>
  );
});

export default RallyeHeader;
