import { Platform } from 'react-native';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.dataLayer) return;
  window.dataLayer.push({ event, ...params });
}

// user_id는 GA4 예약 필드라 이벤트 파라미터로 보내면 안 되고, GTM의 GA4 구성
// 태그 "User-ID" 필드에서 데이터 영역 변수로만 읽어가야 한다. event 키 없이
// 독립적으로 push해서 특정 이벤트의 파라미터로 오인/오매핑되지 않게 한다.
export function setUserId(userId: number | string | null) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.dataLayer) return;
  window.dataLayer.push({ user_id: userId });
  if (userId !== null) {
    console.log('User ID set for GA:', userId);
  } else {
    console.log('User ID cleared for GA.');
  }
}

const UTM_KEYS = ['source', 'medium', 'campaign', 'content'] as const;

// public/index.html이 최초 진입 시 sessionStorage에 남겨둔 session_utm_*
// 값을 읽어온다 — "가입까지 이어진 이번 세션의 UTM"을 sign_up 같은 이벤트에
// 속성으로 직접 붙이고 싶을 때 사용(영구 저장되는 first_touch_*와는 다름).
export function getSessionUtm(): Record<string, string> {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.sessionStorage) return {};
  const result: Record<string, string> = {};
  UTM_KEYS.forEach((key) => {
    result[`utm_${key}`] = window.sessionStorage.getItem(`session_utm_${key}`) ?? '(not set)';
  });
  return result;
}
