import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { store$ } from '../services/storage/Store';
import { useLanguage } from '../utils/LanguageContext';

function calculateTimeRemaining(endTime) {
  const now = new Date();
  const totalMilliseconds = new Date(endTime).getTime() - now;

  let totalSeconds = Math.floor(totalMilliseconds / 1000);

  if (totalSeconds <= 0) {
    // Time is up
    return {
      totalMilliseconds: 0,
      hours: '00',
      minutes: '00',
      seconds: '00',
    };
  }

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    totalMilliseconds,
    hours,
    minutes,
    seconds,
  };
}

const formatTimeUnit = (unit) => {
  return unit.toString().padStart(2, '0');
};

export default function TimeHeader({ endTime }) {
  const [timeRemaining, setTimeRemaining] = useState(
    calculateTimeRemaining(endTime)
  );
  const { language } = useLanguage(); // Use LanguageContext

  useEffect(() => {
    // Update the timer every second
    const timerId = setInterval(() => {
      const updatedTime = calculateTimeRemaining(endTime);
      setTimeRemaining(updatedTime);

      if (updatedTime.totalMilliseconds <= 0) {
        store$.timeExpired.set(true);
        clearInterval(timerId);
      }
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(timerId);
  }, []);

  return (
    <Text
      style={{
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
      }}
    >
      {language === 'de' ? 'Verbleibende Zeit: ' : 'Remaining time: '}
      {formatTimeUnit(timeRemaining.hours)}:
      {formatTimeUnit(timeRemaining.minutes)}:
      {formatTimeUnit(timeRemaining.seconds)}
    </Text>
  );
}
