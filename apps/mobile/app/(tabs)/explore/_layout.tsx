import { Stack } from 'expo-router';

export default function ExploreStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="likes" />
      <Stack.Screen name="contest/[contestId]" />
      <Stack.Screen name="post/[postId]" />
      <Stack.Screen name="participate" />
      <Stack.Screen name="participate-complete" />
    </Stack>
  );
}
