import { Stack } from 'expo-router';

// 다른 탭에서 절대경로로 이 탭의 하위 화면(예: contest/[contestId])에 바로 진입해도
// index가 스택 맨 아래 깔리도록 강제 — 안 하면 뒤로가기가 부모 Tabs로 버블링돼 홈 탭으로 튕김
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function ExploreStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="contest/[contestId]" />
      <Stack.Screen name="post/[postId]" />
      <Stack.Screen name="post/recruiter-profile" />
      <Stack.Screen name="talent/[userId]" />
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
      <Stack.Screen name="chat/[chatId]" />
    </Stack>
  );
}
