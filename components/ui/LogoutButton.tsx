import { TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { store$ } from '@/services/storage/Store';
import { useTheme } from '@/utils/ThemeContext';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { confirm } from '@/utils/ConfirmAlert';

export default function LogoutButton() {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const color = isDarkMode ? Colors.darkMode.text : Colors.lightMode.text;
  return (
    <TouchableOpacity
      onPress={() => {
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
      }}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.logoutButton')}
      accessibilityHint={t('a11y.logoutButtonHint')}
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
