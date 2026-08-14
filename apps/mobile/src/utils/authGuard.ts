import { router } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { Alert } from './alert';
import { trackEvent } from '../services/gtm';

// 로그인이 필요한 액션(후보등록·모집글작성·지원하기 등) 진입점에서 쓰는 공용 가드.
// 로그인돼 있으면 그냥 이동/진행, 아니면 로그인 화면으로 보내고 로그인(+필요시 온보딩) 완료 후
// 원래 가려던 경로로 되돌아오도록 returnTo를 실어 보낸다 (login.tsx/onboarding/basic-info.tsx 참고).
export function withAuth(path: string): void {
  const userId = useAuthStore.getState().currentUserId;
  if (userId) {
    router.push(path as never);
  } else {
    trackEvent('login_button_click', { source: 'withAuth' });
    router.push(`/(auth)/login?returnTo=${encodeURIComponent(path)}` as never);
  }
}

// router.push 대신 API 호출 등 다른 동작이 먼저 필요한 케이스(지원하기 등)에서 사용 —
// 로그인돼 있으면 true를 반환해 이어서 진행하게 하고, 아니면 로그인으로 보내고 false를 반환한다.
export function requireAuth(path: string): boolean {
  const userId = useAuthStore.getState().currentUserId;
  if (userId) return true;
  trackEvent('login_button_click', { source: 'requireAuth' });
  router.push(`/(auth)/login?returnTo=${encodeURIComponent(path)}` as never);
  return false;
}

// 채팅 시작(인재풀 목록/상세, 모집자 프로필 등) 전용 — 다른 가드와 달리 곧바로 로그인 화면으로
// 넘기지 않고, "로그인이 필요해요" 배너를 먼저 띄운 뒤 눌러야 이동한다. 채팅 버튼은 어디서
// 눌리든 항상 이 함수를 거쳐야 한다.
export function requireAuthForChat(path: string): boolean {
  const userId = useAuthStore.getState().currentUserId;
  if (userId) return true;
  Alert.alert('로그인이 필요해요', '채팅을 시작하려면 로그인해주세요', [
    { text: '취소', style: 'cancel' },
    {
      text: '로그인하기',
      onPress: () => {
        trackEvent('login_button_click', { source: 'requireAuthForChat' });
        router.push(`/(auth)/login?returnTo=${encodeURIComponent(path)}` as never);
      },
    },
  ]);
  return false;
}

// 좋아요(하트) 전용 — 게스트가 하트를 누르면 조용히 무시하는 대신 로그인을 유도한다.
export function requireAuthForHeart(): boolean {
  const userId = useAuthStore.getState().currentUserId;
  if (userId) return true;
  Alert.alert('로그인이 필요해요', '좋아요를 누르려면 로그인해주세요', [
    { text: '취소', style: 'cancel' },
    {
      text: '로그인하기',
      onPress: () => {
        trackEvent('login_button_click', { source: 'requireAuthForHeart' });
        router.push('/(auth)/login' as never);
      },
    },
  ]);
  return false;
}
