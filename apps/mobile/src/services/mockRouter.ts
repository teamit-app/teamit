import { dummyContests } from '../data/contests';
import { dummyTalents } from '../data/talents';
import { dummyNotifications } from '../data/notifications';
import { dummyMatchingStatus } from '../data/matchingStatus';

// ─── 정적 라우트: 정확한 경로 일치 ───────────────────────────────────────────

const staticRoutes: Record<string, () => unknown> = {
  // 인재풀 목록 (GET /users?...) — 쿼리스트링은 strip 후 매칭
  '/users': () => ({
    content: dummyTalents.map(({ isHearted: _h, ...rest }) => rest),
    totalElements: dummyTalents.length,
    totalPages: 1,
    currentPage: 0,
  }),

  // 공모전 목록 (GET /contests?...)
  '/contests': () => ({
    content: dummyContests.map(({ isHearted: _h, categoryLabel: _l, status: _s, ...rest }) => rest),
    totalElements: dummyContests.length,
    totalPages: 1,
    currentPage: 0,
  }),

  // 홈 — 인기 공모전 (GET /contests/popular)
  '/contests/popular': () => dummyContests.slice(0, 3),

  // 알림은 동적 라우트(/users/{userId}/notifications)로 처리됨 — 아래 dynamicRoutes 참고
  // GET /home/matching-status?userId=...  (쿼리스트링은 strip 후 매칭)
  '/home/matching-status': () => ({
    receivedInvitationCount: dummyMatchingStatus.receivedProposalCount,
    appliedTeamCount: dummyMatchingStatus.appliedTeamCount,
  }),

  // 온보딩
  '/users/onboarding/basic': () => ({
    userId: 1,
    nickname: 'mock유저',
    name: '테스트',
    gender: 'MALE',
    birthDate: '2000-01-01',
  }),
};

// ─── 동적 라우트: 경로 파라미터 포함 ──────────────────────────────────────────
// ※ 순서 중요 — 더 구체적인 패턴이 앞에 와야 함

const dynamicRoutes: Array<[RegExp, (path: string) => unknown]> = [
  // GET /contests/:id
  [
    /^\/contests\/(\d+)$/,
    (path) => {
      const id = Number(path.split('/')[2]);
      return dummyContests.find((c) => c.contestId === id) ?? null;
    },
  ],

  // GET /users/{userId}/hearts/{targetUserId}  (POST→추가, DELETE→취소 응답도 null)
  [/^\/users\/\d+\/hearts\/\d+$/, () => null],

  // GET /users/{userId}/hearts — 관심 팀원 목록 (dummyTalents 중 isHearted:true)
  [
    /^\/users\/\d+\/hearts$/,
    () => ({
      content: dummyTalents
        .filter((t) => t.isHearted)
        .map((t) => ({ userId: t.userId })),
    }),
  ],

  // GET /users/{userId}/contest-hearts/{contestId}  (POST/DELETE 응답도 null)
  [/^\/users\/\d+\/contest-hearts\/\d+$/, () => null],

  // GET /users/{userId}/contest-hearts — 관심 공모전 목록
  [
    /^\/users\/\d+\/contest-hearts$/,
    () => ({
      content: dummyContests
        .filter((c) => c.isHearted)
        .map((c) => ({ contestId: c.contestId })),
    }),
  ],

  // GET /users/{userId}/notifications
  [
    /^\/users\/\d+\/notifications$/,
    () => ({ content: dummyNotifications, unreadCount: dummyNotifications.filter((n) => !n.isRead).length }),
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
