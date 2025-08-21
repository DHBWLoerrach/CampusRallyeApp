import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { store$ } from '@/services/storage/Store';

export default function InfosStackLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity
            onPress={() => {
              store$.enabled.set(false);
            }}
            accessibilityLabel="Logout"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ paddingHorizontal: 8 }}
          >
            <IconSymbol
              name="rectangle.portrait.and.arrow.right"
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: true, title: 'Informationen' }}
      />
      <Stack.Screen name="imprint" options={{ title: 'Impressum' }} />
      <Stack.Screen name="about" options={{ title: 'Über diese App' }} />
    </Stack>
  );
}
