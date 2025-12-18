import { Alert, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { store$ } from '@/services/storage/Store';
import { useTheme } from '@/utils/ThemeContext';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';

export default function LogoutButton() {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const color = isDarkMode ? Colors.darkMode.text : Colors.lightMode.text;
  return (
    <TouchableOpacity
      onPress={() => {
        Alert.alert(
          language === 'de' ? 'Teilnahme beenden' : 'End participation',
          language === 'de'
            ? 'Möchtest du die Teilnahme an der Rallye wirklich beenden? Die Teamzuordnung auf diesem Gerät wird gelöscht.'
            : 'Do you really want to end participation? The team assignment on this device will be removed.',
          [
            {
              text: language === 'de' ? 'Abbrechen' : 'Cancel',
              style: 'cancel',
            },
            {
              text: language === 'de' ? 'Beenden' : 'End',
              style: 'destructive',
              onPress: () => {
                void store$.leaveRallye();
              },
            },
          ]
        );
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
