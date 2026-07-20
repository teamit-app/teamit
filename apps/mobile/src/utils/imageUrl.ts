const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.teamit.kr/api/v1';

// 카카오 프로필 사진은 이미 절대 URL(외부 CDN)이지만, 직접 업로드한 프로필 사진은 서버가
// "/files/..." 같은 상대 경로만 내려준다(WebMvcConfig 참고) — 상대 경로일 때만 서버 origin을
// 붙여준다. origin은 API_BASE_URL에서 "/api/v1"을 뗀 값 (socket.ts의 WS URL 변환과 동일한 방식)
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url}`;
}
