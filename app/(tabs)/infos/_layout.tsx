import { Stack } from 'expo-router';
import LogoutButton from '@/components/ui/LogoutButton';

export default function InfosStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerRight: () => <LogoutButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Informationen' }} />
      <Stack.Screen name="imprint" options={{ title: 'Impressum' }} />
      <Stack.Screen name="about" options={{ title: 'Über diese App' }} />
    </Stack>
  );
}
