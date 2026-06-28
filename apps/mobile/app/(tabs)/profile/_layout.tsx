import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-basic" />
      <Stack.Screen name="education" />
      <Stack.Screen name="education-cert" />
      <Stack.Screen name="my-applications" />
      <Stack.Screen name="participant-card" />
      <Stack.Screen name="received-applications" />
      <Stack.Screen name="notification-settings" />
      <Stack.Screen name="careers" />
      <Stack.Screen name="add-experience" />
      <Stack.Screen name="add-contest" />
      <Stack.Screen name="add-certificate" />
      <Stack.Screen name="matching-profile" />
      <Stack.Screen name="applicants" />
      <Stack.Screen name="applicant-detail" />
      <Stack.Screen name="likes" />
      <Stack.Screen name="post/[postId]" />
    </Stack>
  );
}
