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
//
// 단, null로 지우는 경우(로그아웃/탈퇴)만은 예외적으로 event 키를 붙여
// 'clear_user_id'라는 전용 이벤트로 push한다 — event 키가 없으면 GTM 트리거가
// "지금 이 시점에 지워졌다"를 감지할 신호가 없어서, logout/withdraw 이벤트와
// 같은 트리거를 공유하게 되고 두 태그의 실행 순서가 보장되지 않는다(둘 다 같은
// 트리거에서 동시에 발동 후보가 됨). event 키를 분리해 dataLayer push 순서 자체로
// "이벤트 먼저 → 그 다음 클리어" 순서를 강제한다.
export function setUserId(userId: number | string | null) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.dataLayer) return;
  if (userId === null) {
    window.dataLayer.push({ event: 'clear_user_id', user_id: null });
    console.log('User ID cleared for GA.');
  } else {
    window.dataLayer.push({ user_id: userId });
    console.log('User ID set for GA:', userId);
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
