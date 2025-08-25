import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { store$ } from '@/services/storage/Store';
import { useLanguage } from '@/utils/LanguageContext';

function calculateTimeRemaining(endTime?: string | Date | null) {
  if (!endTime) {
    return { totalMs: 0, h: 0, m: 0, s: 0 };
  }
  const now = Date.now();
  const end = new Date(endTime).getTime();
  const totalMs = Math.max(0, end - now);
  let totalSeconds = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return { totalMs, h, m, s };
}

const two = (n: number) => n.toString().padStart(2, '0');

export default function TimerHeader({ endTime }: { endTime?: string | Date | null }) {
  const [t, setT] = useState(() => calculateTimeRemaining(endTime));
  const { language } = useLanguage();

  useEffect(() => {
    const id = setInterval(() => {
      const next = calculateTimeRemaining(endTime);
      setT(next);
      if (next.totalMs <= 0) {
        store$.timeExpired.set(true);
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return (
    <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
      {language === 'de' ? 'Zeit: ' : 'Time: '} {two(t.h)}:{two(t.m)}:{two(t.s)}
    </Text>
  );
}

