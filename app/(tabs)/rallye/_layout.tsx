import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import RallyeHeader from '@/components/rallye/RallyeHeader';
import TimerHeader from '@/components/rallye/TimerHeader';
import { store$ } from '@/services/storage/Store';
import Colors from '@/utils/Colors';
import { confirm } from '@/utils/ConfirmAlert';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';

export default function RallyeStackLayout() {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const rallye = useSelector(() => store$.rallye.get());
  const isTourMode = useSelector(() => store$.isTourMode.get());
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const showTimer = rallye?.status === 'running' && !isTourMode;

  const handleLeaveRallye = () => {
    void (async () => {
      const confirmed = await confirm({
        title: t('confirm.exit.title'),
        message: t('confirm.exit.message'),
        confirmText: t('confirm.exit.confirm'),
        cancelText: t('common.cancel'),
        destructive: true,
      });
      if (!confirmed) return;
      void store$.leaveRallye();
    })();
  };

  return (
    <Stack
      screenOptions={{
        headerLeft: () => (
          <View style={{ paddingLeft: 16 }}>
            <RallyeHeader />
          </View>
        ),
        headerTitle: () =>
          showTimer ? <TimerHeader endTime={rallye?.end_time} /> : null,
        headerStyle: { backgroundColor: palette.surface1 },
        headerTitleStyle: { color: palette.text },
        headerTintColor: palette.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Rallye' }}>
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityHint={t('a11y.logoutButtonHint')}
            accessibilityLabel={t('a11y.logoutButton')}
            icon="rectangle.portrait.and.arrow.right"
            onPress={handleLeaveRallye}
            tintColor={palette.text}
          />
        </Stack.Toolbar>
      </Stack.Screen>
    </Stack>
  );
}
