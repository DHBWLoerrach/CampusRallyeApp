import { TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { store$ } from '@/services/storage/Store';
import { useTheme } from '@/utils/ThemeContext';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { confirm } from '@/utils/ConfirmAlert';

export default function LogoutButton() {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const color = isDarkMode ? Colors.darkMode.text : Colors.lightMode.text;
  return (
    <TouchableOpacity
      onPress={() => {
        void (async () => {
          const confirmed = await confirm({
            title: language === 'de' ? 'Teilnahme beenden' : 'End participation',
            message:
              language === 'de'
                ? 'Möchtest du die Teilnahme an der Rallye wirklich beenden? Die Teamzuordnung auf diesem Gerät wird gelöscht.'
                : 'Do you really want to end participation? The team assignment on this device will be removed.',
            confirmText: language === 'de' ? 'Beenden' : 'End',
            cancelText: language === 'de' ? 'Abbrechen' : 'Cancel',
            destructive: true,
          });
          if (!confirmed) return;
          void store$.leaveRallye();
        })();
      }}
      accessibilityLabel={
        language === 'de' ? 'Teilnahme beenden' : 'End participation'
      }
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{ paddingHorizontal: 8 }}
    >
      <IconSymbol
        name="rectangle.portrait.and.arrow.right"
        size={22}
        color={color}
      />
    </TouchableOpacity>
  );
}
