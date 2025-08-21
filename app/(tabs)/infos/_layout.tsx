import { Stack } from 'expo-router';

export default function InfosStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Informationen' }} />
      <Stack.Screen name="imprint" options={{ title: 'Impressum' }} />
      <Stack.Screen name="about" options={{ title: 'Über diese App' }} />
    </Stack>
  );
}
