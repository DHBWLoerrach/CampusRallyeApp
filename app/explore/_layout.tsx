import { Stack } from 'expo-router';

export default function ExploreLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Explore',
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
        name="results" 
        options={{ 
          title: 'Results',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}