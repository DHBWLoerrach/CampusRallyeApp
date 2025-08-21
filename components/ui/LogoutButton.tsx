import { TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { store$ } from '@/services/storage/Store';

export default function LogoutButton() {
  return (
    <TouchableOpacity
      onPress={() => store$.enabled.set(false)}
      accessibilityLabel="Logout"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{ paddingHorizontal: 8 }}
    >
      <IconSymbol
        name="rectangle.portrait.and.arrow.right"
        size={22}
        color="#000"
      />
    </TouchableOpacity>
  );
}
