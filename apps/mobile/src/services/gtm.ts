import { Platform } from 'react-native';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

// 서비스 이용기록·기기정보 수집(GA4/GTM/Meta Pixel)은 선택 동의 대상이라, 동의
// 여부를 확인하기 전까지는 아무 이벤트도 실제로 전송하지 않는다. 기본값은 항상
// 거부(false) — 로그인 성공 시(useAuthStore.fetchCurrentUserId)와 동의 화면
// 제출 시(basic-info.tsx, reconsent.tsx)에 실제 값으로 갱신된다.
let analyticsConsentGranted = false;
const META_PIXEL_ID = '1768571457666086';
let metaPixelInitialized = false;

// 로그인/동의 상태가 바뀔 때마다 호출한다. GA4는 Google의 공식 Consent Mode로
// (denied여도 완전히 끊기는 대신 비식별 상태로 남게) 갱신하고, Meta Pixel은
// Consent Mode 개념이 없어서 동의 시점에 처음으로 init/PageView를 직접 호출한다.
export function setAnalyticsConsent(granted: boolean) {
  analyticsConsentGranted = granted;
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  window.gtag?.('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
  });

  if (granted && !metaPixelInitialized && typeof window.fbq === 'function') {
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
    metaPixelInitialized = true;
  }
}

export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.dataLayer) return;
  if (!analyticsConsentGranted) return;
  window.dataLayer.push({ event, ...params });
}

// public/index.html에 삽입된 Meta Pixel 베이스 코드가 초기화한 전역 fbq를 호출.
// 네이티브(iOS/Android)에는 fbq가 존재하지 않으므로 web에서만 동작.
export function trackFbq(event: string, params?: Record<string, unknown>) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (!analyticsConsentGranted) return;
  window.fbq('track', event, params);
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
//
// 지우는 동작은 동의 여부와 무관하게 항상 허용한다(개인정보를 없애는 방향이라
// 막을 이유가 없음) — 동의 게이팅은 새로 값을 "설정"하는 쪽에만 건다.
export function setUserId(userId: number | string | null) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.dataLayer) return;
  if (userId === null) {
    window.dataLayer.push({ event: 'clear_user_id', user_id: null });
    console.log('User ID cleared for GA.');
    return;
  }
  if (!analyticsConsentGranted) return;
  window.dataLayer.push({ user_id: userId });
  console.log('User ID set for GA:', userId);
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
