import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[chatId]" />
      <Stack.Screen name="invitation-detail/[invitationId]" />
      <Stack.Screen name="review-write" />
      <Stack.Screen name="review-complete" />
      <Stack.Screen name="my-reviews" />
      <Stack.Screen name="talent/[userId]" />
      <Stack.Screen name="post/[postId]" />
      <Stack.Screen name="post/recruiter-profile" />
      <Stack.Screen name="contest/[contestId]" />
    </Stack>
  );
}
