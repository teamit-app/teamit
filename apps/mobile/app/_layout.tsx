import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WebCenteredFrame } from '../src/components/common/WebCenteredFrame';
import { AlertHost } from '../src/components/common/AlertHost';

export default function RootLayout() {
  return (
    <WebCenteredFrame>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin/education-verifications" />
        <Stack.Screen name="admin/contests" />
      </Stack>
      <AlertHost />
    </WebCenteredFrame>
  );
}
