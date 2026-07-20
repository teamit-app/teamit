import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { tokenStorage } from '../src/services/tokenStorage';
import { useOnboardingStore } from '../src/store/useOnboardingStore';
import { useAuthStore } from '../src/store/useAuthStore';

// 로그인은 이제 "필요한 순간"에만 요구한다(메시지/내정보 탭 진입, 후보등록·모집글작성·지원하기 등) —
// 앱 시작 시점엔 토큰이 없거나 만료됐어도 게스트로 바로 홈에 들어간다. 온보딩(기본정보) 강제도
// 여기서 안 하고, 로그인 게이트를 통과한 뒤 authGuard의 복귀 체인에서 필요할 때만 거친다.
export default function Index() {
  const [target, setTarget] = useState<'/(tabs)/home' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token) { setTarget('/(tabs)/home'); return; }

        const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.teamit.app/api/v1';
        const res = await fetch(`${BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) { setTarget('/(tabs)/home'); return; }

        const json = await res.json();
        if (json.data?.userId) {
          useOnboardingStore.getState().setUserId(json.data.userId);
          // (tabs)/_layout.tsx의 fetchCurrentUserId()는 탭이 마운트된 뒤에야 실행되는데,
          // 그 전에 explore 탭 등에서 currentUserId를 읽는 로직이 먼저 돌면 아직 null인
          // 상태를 "비로그인"으로 오판해 데이터를 잘못 캐싱하는 레이스 컨디션이 생긴다.
          // 여기서 이미 확보한 userId를 authStore에도 바로 반영해 그 창을 없앤다.
          useAuthStore.getState().setCurrentUserId(json.data.userId);
        }
        setTarget('/(tabs)/home');
      } catch {
        setTarget('/(tabs)/home');
      }
    })();
  }, []);

  // 토큰 확인 중 — 흰 화면 유지
  if (!target) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  return <Redirect href={target} />;
}
