import { View, Text } from 'react-native';
import * as Progress from 'react-native-progress';
import { observer } from '@legendapp/state/react';
import { currentTime } from '@legendapp/state/helpers/time';
import TimeHeader from './TimeHeader';
import { useLanguage } from '../utils/LanguageContext';

const RallyeHeader = observer(function RallyeHeader({ rallye, percentage }) {
  const { language } = useLanguage();
  const currentTime$ = currentTime.get();

  const ProgressBar = () => (
    <Progress.Bar
      style={{ marginTop: 10 }}
      progress={percentage}
      color="white"
    />
  );

  return (
    <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
      {rallye ? (
        rallye.status === 'running' &&
        !rallye.tour_mode &&
        new Date(currentTime$).getTime() <
          new Date(rallye.end_time).getTime() ? (
          <View style={{ alignItems: 'center' }}>
            <TimeHeader endTime={rallye.end_time} />
            <ProgressBar />
          </View>
        ) : (
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '500',
            }}
          >
            {rallye.tour_mode &&
              (language === 'de' ? 'Campus erkunden' : 'Explore campus')}
            {rallye.status === 'preparing' &&
              (language === 'de' ? 'Vorbereitungen' : 'Preparations')}
            {rallye.status === 'post_processing' &&
              (language === 'de' ? 'Abstimmung' : 'Voting')}
            {rallye.status === 'running' &&
              !rallye.tour_mode &&
              (language === 'de' ? 'Zeit abgelaufen' : 'Time is up')}
            {rallye.status === 'ended' &&
              (language === 'de' ? 'Rallye beendet' : 'Rallye ended')}
          </Text>
        )
      ) : (
        <ProgressBar />
      )}
    </View>
  );
});

export default RallyeHeader;
