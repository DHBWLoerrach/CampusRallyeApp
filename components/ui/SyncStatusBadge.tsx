import React from 'react';
import { View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { outbox$ } from '@/services/storage/offlineOutbox';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedText from '@/components/themed/ThemedText';

export default function SyncStatusBadge() {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();

  const online = useSelector(() => outbox$.online.get());
  const syncing = useSelector(() => outbox$.syncing.get());
  const queueCount = useSelector(() => outbox$.queueCount.get());
  const lastError = useSelector(() => outbox$.lastError.get());

  const show = !online || syncing || queueCount > 0 || !!lastError;
  if (!show) return null;

  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  let text: string;
  if (!online) {
    text =
      language === 'de'
        ? 'Offline: Antworten werden gespeichert'
        : 'Offline: answers will be saved';
  } else if (syncing) {
    text = language === 'de' ? 'Synchronisiere…' : 'Syncing…';
  } else if (lastError) {
    text =
      language === 'de'
        ? 'Synchronisierung fehlgeschlagen'
        : 'Sync failed';
  } else {
    text =
      language === 'de'
        ? `${queueCount} ausstehend`
        : `${queueCount} pending`;
  }

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: palette.card,
        borderWidth: 1,
        borderColor: palette.cellBorder,
        marginBottom: 10,
      }}
    >
      <ThemedText style={{ fontSize: 12, opacity: 0.9 }}>{text}</ThemedText>
    </View>
  );
}

