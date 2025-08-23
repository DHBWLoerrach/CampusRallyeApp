import { Stack } from 'expo-router';

export default function RallyLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Rally',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="team" 
        options={{ 
          title: 'Team',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="questions" 
        options={{ 
          title: 'Questions',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="voting" 
        options={{ 
          title: 'Voting',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="scoreboard" 
        options={{ 
          title: 'Scoreboard',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}