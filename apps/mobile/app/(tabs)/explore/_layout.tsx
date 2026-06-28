import { Stack } from 'expo-router';

export default function ExploreStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="contest/[contestId]" />
      <Stack.Screen name="post/[postId]" />
      <Stack.Screen name="participate" />
      <Stack.Screen name="participate-complete" />
      <Stack.Screen name="build-team/[contestId]" />
      <Stack.Screen name="build-team/recruit-count" />
      <Stack.Screen name="build-team/recruit-skills" />
      <Stack.Screen name="build-team/recruit-conditions" />
      <Stack.Screen name="build-team/recruit-post" />
      <Stack.Screen name="build-team/recruit-confirm" />
      <Stack.Screen name="build-team/matching-loading" />
      <Stack.Screen name="build-team/candidates" />
      <Stack.Screen name="build-team/candidate/[id]" />
    </Stack>
  );
}
