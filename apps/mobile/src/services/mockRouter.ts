import { dummyContests } from '../data/contests';
import { dummyTalents } from '../data/talents';
import { dummyNotifications } from '../data/notifications';
import { dummyMatchingStatus } from '../data/matchingStatus';

// ─── 정적 라우트: 정확한 경로 일치 ───────────────────────────────────────────
const staticRoutes: Record<string, () => unknown> = {
  '/contests': () => dummyContests,
  '/contests/popular': () => dummyContests.slice(0, 3),
  '/talent-pool': () => dummyTalents,
  '/notifications': () => dummyNotifications,
  '/matching/status': () => dummyMatchingStatus,

  // 온보딩 (POST - 반환값만 필요한 구조)
  '/users/onboarding/basic': () => ({
    userId: 1,
    nickname: 'mock유저',
    name: '테스트',
    gender: 'MALE',
    birthDate: '2000-01-01',
  }),
};

// ─── 동적 라우트: 경로 파라미터 포함 (예: /contests/:id) ──────────────────────
const dynamicRoutes: Array<[RegExp, (path: string) => unknown]> = [
  [
    /^\/contests\/(\d+)$/,
    (path) => {
      const id = Number(path.split('/')[2]);
      return dummyContests.find((c) => c.contestId === id) ?? null;
    },
  ],
  // POST /users/{userId}/regions
  [/^\/users\/\d+\/regions$/, () => ({ regions: [] })],
  // POST /users/{userId}/educations
  [
    /^\/users\/\d+\/educations$/,
    () => ({
      educationId: 1,
      schoolName: '한국대학교',
      status: 'ATTENDING',
      major: '컴퓨터공학',
      verified: false,
    }),
  ],
];

/**
 * 엔드포인트 경로에 대응하는 mock 데이터를 반환합니다.
 * 새 API를 추가할 때는 staticRoutes 또는 dynamicRoutes에만 항목을 추가하세요.
 */
export function getMockResponse<T>(endpoint: string): Promise<T> {
  const path = endpoint.split('?')[0];

  // 1. 정적 라우트 우선 탐색
  const staticHandler = staticRoutes[path];
  if (staticHandler) {
    return Promise.resolve(staticHandler() as T);
  }

  // 2. 동적 라우트 패턴 매칭
  for (const [pattern, handler] of dynamicRoutes) {
    if (pattern.test(path)) {
      return Promise.resolve(handler(path) as T);
    }
  }

  return Promise.reject(
    new Error(
      `[MOCK] 등록되지 않은 엔드포인트: ${path}\n` +
        `mockRouter.ts의 staticRoutes 또는 dynamicRoutes에 mock 데이터를 추가해주세요.`,
    ),
  );
}
