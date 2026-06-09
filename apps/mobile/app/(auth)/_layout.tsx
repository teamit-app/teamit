import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding/basic-info" />
      <Stack.Screen name="onboarding/region" />
      <Stack.Screen name="onboarding/education" />
    </Stack>
  );
}
