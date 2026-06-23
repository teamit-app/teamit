import { Stack } from 'expo-router';

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
    </Stack>
  );
}
