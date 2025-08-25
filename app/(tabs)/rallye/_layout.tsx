import { Stack } from 'expo-router';
import LogoutButton from '@/components/ui/LogoutButton';
import RallyeHeader from '@/components/rallye/RallyeHeader';

export default function RallyeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerRight: () => <LogoutButton />,
        headerTitle: () => <RallyeHeader />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Rallye' }} />
    </Stack>
  );
}

