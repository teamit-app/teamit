import { dummyContests } from '../data/contests';
import { dummyTalents } from '../data/talents';
import { dummyNotifications } from '../data/notifications';
import { dummyMatchingStatus } from '../data/matchingStatus';
import { dummyInvitations } from '../data/invitations';
import {
  dummyChatRooms,
  dummyDirectMessages1,
  dummyDirectMessages2,
  dummyDirectMessages3,
  dummyDirectMessages4,
  dummyDirectMessages7,
  dummyGroupMessages1,
  dummyGroupMessages2,
  dummyGroupMessages10,
} from '../data/chatRooms';
import { Message } from '../types/message';
import {
  dummyMyProfile,
  dummyMatchingProfile,
  dummyNotificationSettings,
  dummyContestRegistrations,
  dummyPostApplications,
  dummyReceivedApplicationPosts,
  dummyPostApplicants,
  dummyLikedPosts,
} from '../data/mypage';

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

  // 홈 — 인기 공모전 (GET /contests/popular) — 백엔드 응답 포맷 { contests: [...] }
  '/contests/popular': () => ({
    contests: dummyContests
      .slice(0, 3)
      .map(({ isHearted: _h, categoryLabel: _l, status: _s, ...rest }) => rest),
  }),

  // GET /users/notifications — @LoginUser 방식 (userId 없는 경로)
  '/users/notifications': () => ({
    content: dummyNotifications,
    unreadCount: dummyNotifications.filter((n) => !n.isRead).length,
  }),

  // GET /home/matching-status — @LoginUser 방식 (쿼리스트링 없음)
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

  // 온보딩 지역/학력 저장 (@LoginUser 방식 — userId 없는 경로)
  '/users/regions': () => ({ regions: [] }),
  '/users/educations': () => ({
    educationId: 1,
    schoolName: '한국대학교',
    status: 'ATTENDING',
    major: '컴퓨터공학',
    verified: false,
  }),

  // 관심 팀원 (@LoginUser 방식)
  '/users/hearts': () => ({
    content: dummyTalents
      .filter((t) => t.isHearted)
      .map((t) => ({ userId: t.userId })),
  }),

  // 관심 공모전 (@LoginUser 방식)
  '/users/contest-hearts': () => ({
    content: dummyContests
      .filter((c) => c.isHearted)
      .map((c) => ({ contestId: c.contestId })),
  }),

  // GET /users/chat-rooms — @LoginUser 방식 (userId 없는 경로)
  '/users/chat-rooms': () => ({
    groupChats: dummyChatRooms
      .filter((r) => r.type === 'group')
      .map((r) => ({
        chatRoomId: r.id,
        roomType: 'GROUP',
        teamName: r.name,
        memberCount: r.participants.length,
        lastMessage: r.lastMessage,
        lastMessageAt: r.lastMessageAt,
        unreadCount: r.unreadCount,
      })),
    directChats: dummyChatRooms
      .filter((r) => r.type === 'direct')
      .map((r) => ({
        chatRoomId: r.id,
        roomType: 'DIRECT',
        opponentNickname: r.name,
        lastMessage: r.lastMessage,
        lastMessageAt: r.lastMessageAt,
        unreadCount: r.unreadCount,
      })),
  }),

  // POST /users/chat-rooms/direct — @LoginUser 방식
  '/users/chat-rooms/direct': () => {
    const directRoom = dummyChatRooms.find((r) => r.type === 'direct');
    return { chatRoomId: directRoom?.id ?? 3 };
  },

  // GET /users/invitations — 받은 초대장 목록
  '/users/invitations': () => ({
    content: dummyInvitations,
  }),

  // ─── 마이페이지 ─────────────────────────────────────────────────────────────
  '/users/me': () => dummyMyProfile,
  '/users/matching-profile': () => dummyMatchingProfile,
  '/users/matching-status': () => null,
  '/users/notification-settings': () => dummyNotificationSettings,
  '/users/contest-registrations': () => dummyContestRegistrations,
  '/users/my-applications': () => dummyPostApplications,
  '/users/received-applications': () => dummyReceivedApplicationPosts,
  '/users/liked-posts': () => dummyLikedPosts,
  '/users/careers/contests': () => ({
    careerItemId: Date.now(),
    careerType: 'CONTEST',
    contestName: '신규 공모전',
    roles: [],
    startDate: '',
    endDate: '',
    awardStatus: 'PARTICIPATED',
  }),
  '/users/careers/certificates': () => ({
    careerItemId: Date.now(),
    careerType: 'CERTIFICATE',
    certName: '신규 자격증',
    issuingOrg: '',
    acquiredDate: '',
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

  // POST /users/hearts/{targetUserId}, DELETE /users/hearts/{targetUserId}
  [/^\/users\/hearts\/\d+$/, () => null],

  // POST /users/contest-hearts/{contestId}, DELETE /users/contest-hearts/{contestId}
  [/^\/users\/contest-hearts\/\d+$/, () => null],

  // POST /posts — 모집글 생성
  [/^\/posts$/, () => ({ postId: Date.now(), title: '팀원을 모집합니다', status: 'OPEN' })],

  // POST /posts/{postId}/invitations — 초대장 보내기
  [/^\/posts\/\d+\/invitations$/, () => ({ invitationId: Date.now(), status: 'PENDING', chatRoomId: 5 })],

  // POST /users/invitations/{id}/decline, POST /users/invitations/{id}/accept
  [/^\/users\/invitations\/\d+\/(decline|accept)$/, () => null],

  // DELETE /users/careers/{careerItemId}
  [/^\/users\/careers\/\d+$/, () => null],

  // GET /users/posts/{postId}/applicants
  [/^\/users\/posts\/\d+\/applicants$/, () => dummyPostApplicants],

  // GET /users/posts/{postId}/candidates
  [/^\/users\/posts\/\d+\/candidates$/, () => dummyPostApplicants.slice(0, 2)],

  // POST|GET /users/educations/{educationId}/verification
  [
    /^\/users\/educations\/\d+\/verification$/,
    () => ({
      status: 'PENDING',
      docType: 'ENROLLMENT_CERT',
      fileName: '재학증명서_2025.jpg',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      rejectReason: null,
    }),
  ],

  // GET /users/{userId}/notifications
  [
    /^\/users\/\d+\/notifications$/,
    () => ({ content: dummyNotifications, unreadCount: dummyNotifications.filter((n) => !n.isRead).length }),
  ],

  // GET /chat-rooms/{chatRoomId}/messages — dummy 메시지를 백엔드 포맷으로 변환
  [
    /^\/chat-rooms\/(\d+)\/messages$/,
    (path) => {
      const id = Number(path.split('/')[2]);
      const msgMap: Record<number, Message[]> = {
        1:  dummyGroupMessages1,
        2:  dummyGroupMessages2,
        3:  dummyDirectMessages1,
        4:  dummyDirectMessages2,
        5:  dummyDirectMessages3,
        6:  dummyDirectMessages4,
        7:  dummyDirectMessages7,
        10: dummyGroupMessages10,
      };
      const msgs = msgMap[id] ?? [];
      return {
        content: msgs.map((m) => ({
          messageId: m.id,
          senderId: m.senderId,
          senderNickname: m.senderName,
          content: m.content,
          isRead: true,
          createdAt: m.createdAt,
          isSystem: m.isSystem ?? false,
          invitationCard: m.invitationCard,
        })),
        totalElements: msgs.length,
        currentPage: 0,
      };
    },
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
