import { Stack } from 'expo-router';

export default function ExploreStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="likes" />
    </Stack>
  );
}
