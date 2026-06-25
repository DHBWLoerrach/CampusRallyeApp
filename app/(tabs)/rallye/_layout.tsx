import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform, Pressable } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import TimerHeader from '@/components/rallye/TimerHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
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

  useEffect(() => {
    return () => {
      if (!store$.enabled.get()) {
        store$.clearRallyeSession();
      }
    };
  }, []);

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
        headerTitle: () =>
          showTimer ? <TimerHeader endTime={rallye?.end_time} /> : null,
        headerStyle: { backgroundColor: palette.surface1 },
        headerTitleStyle: { color: palette.text },
        headerTintColor: palette.text,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Rallye',
          // Android renders Stack.Toolbar as a floating bottom toolbar and
          // ignores SF Symbol icons, so place the logout action in the header
          // instead. iOS keeps the native trailing toolbar button below.
          ...(Platform.OS === 'android'
            ? {
                headerRight: () => (
                  <Pressable
                    accessibilityHint={t('a11y.logoutButtonHint')}
                    accessibilityLabel={t('a11y.logoutButton')}
                    accessibilityRole="button"
                    hitSlop={12}
                    onPress={handleLeaveRallye}
                    style={{ paddingRight: 16 }}
                  >
                    <IconSymbol
                      name="rectangle.portrait.and.arrow.right"
                      size={22}
                      color={palette.text}
                    />
                  </Pressable>
                ),
              }
            : {}),
        }}
      >
        {Platform.OS === 'ios' ? (
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              accessibilityHint={t('a11y.logoutButtonHint')}
              accessibilityLabel={t('a11y.logoutButton')}
              icon="rectangle.portrait.and.arrow.right"
              onPress={handleLeaveRallye}
              tintColor={palette.text}
            />
          </Stack.Toolbar>
        ) : null}
      </Stack.Screen>
      <Stack.Screen
        name="team-name-sheet"
        options={{
          contentStyle: { backgroundColor: 'transparent' },
          headerShown: false,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.22],
          sheetGrabberVisible: true,
        }}
      />
    </Stack>
  );
}
