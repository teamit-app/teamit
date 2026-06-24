import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { tokenStorage } from '../src/services/tokenStorage';
import { useOnboardingStore } from '../src/store/useOnboardingStore';

export default function Index() {
  const [target, setTarget] = useState<'/(tabs)/home' | '/(auth)/login' | '/(auth)/onboarding/basic-info' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token) { setTarget('/(auth)/login'); return; }

        const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.teamit.app/api/v1';
        const res = await fetch(`${BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) { setTarget('/(auth)/login'); return; }

        const json = await res.json();
        if (json.data?.needsOnboarding) {
          setTarget('/(auth)/onboarding/basic-info');
        } else {
          useOnboardingStore.getState().setUserId(0);
          setTarget('/(tabs)/home');
        }
      } catch {
        setTarget('/(auth)/login');
      }
    })();
  }, []);

  // 토큰 확인 중 — 흰 화면 유지
  if (!target) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  return <Redirect href={target} />;
}
