import { Stack } from 'expo-router';

export default function RallyeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Rallye' }} />
    </Stack>
  );
}
