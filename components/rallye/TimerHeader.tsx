import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { store$ } from '@/services/storage/Store';
import { useTheme } from '@/utils/ThemeContext';
import Colors from '@/utils/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

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
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <IconSymbol name="clock" size={16} color={palette.text} />
      <Text style={{ color: palette.text, fontSize: 14, fontWeight: '500' }}>
        {two(t.h)}:{two(t.m)}:{two(t.s)}
      </Text>
    </View>
  );
}
