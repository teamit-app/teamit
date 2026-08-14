import { dummyContests } from '../data/contests';
import { dummyTalents, dummyTalentDetails } from '../data/talents';
import { dummyNotifications } from '../data/notifications';
import { dummyMatchingStatus } from '../data/matchingStatus';
import { dummyInvitations } from '../data/invitations';
import { dummyContestDetails, dummyRecruitPosts, dummyRecruitPostDetails } from '../data/recruitmentPosts';
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
  dummyPostApplicants,
  dummyLikedPosts,
} from '../data/mypage';

// 공모전 후보 등록 mock 상태 — 앱 재시작/리로드 시 초기화되는 인메모리 저장소
const mockParticipantContestIds = new Set<number>();

// 모집글 좋아요 mock 상태 — 앱 재시작/리로드 시 초기화되는 인메모리 저장소
const mockHeartedPostIds = new Set<number>();
const mockExtraComments: Record<number, { commentId: number; authorName: string; content: string; createdAt: string; isAuthor: boolean; isReply?: boolean }[]> = {};

// dummy 데이터의 한글 meetingType('온라인'/'오프라인'/'온오프라인 혼합')을
// 백엔드 raw enum('ONLINE'/'OFFLINE'/'MIXED')으로 변환
const normalizeMeetingTypeForMock = (type: string): string => {
  if (type.includes('혼합')) return 'MIXED';
  if (type.includes('오프라인')) return 'OFFLINE';
  return 'ONLINE';
};

// dummyRecruitPosts 원소 → PostListItem(BE 응답 shape) 변환. 내 모집글 목록(/users/posts)과
// 전체 모집글 목록(GET /posts) 양쪽에서 공유한다.
const mapRecruitPostToListItem = (p: (typeof dummyRecruitPosts)[number]) => ({
  postId: p.postId,
  contestId: p.contestId,
  chatRoomId: null,
  title: p.title,
  description: null,
  status: 'OPEN',
  recruitCount: p.totalMembers,
  deadline: null,
  onlineOffline: normalizeMeetingTypeForMock(p.meetingType),
  genderCondition: 'ANY',
  experienceCondition: p.experienceCondition,
  purposeCondition: p.purposeCondition,
  recruiterGender: 'FEMALE',
  skills: p.skills,
  region: p.location || null,
  createdAt: p.createdAt,
  currentMembers: p.currentMembers,
  ownerUserId: null,
  viewCount: p.views,
  likeCount: p.likeCount + (mockHeartedPostIds.has(p.postId) ? 1 : 0),
  commentCount: p.chatCount,
  applicantCount: Math.max(p.currentMembers - 1, 0),
  contestTitle: dummyContests.find((c) => c.contestId === p.contestId)?.title ?? null,
});

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
    receivedInvitationCount: dummyMatchingStatus.receivedInvitationCount,
    myPostApplicantCount: dummyMatchingStatus.myPostApplicantCount,
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
    content: dummyTalents.filter((t) => t.isHearted),
  }),

  // 관심 공모전 (@LoginUser 방식)
  '/users/contest-hearts': () => ({
    content: dummyContests.filter((c) => c.isHearted),
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
        // teamInfo 필드: 백엔드 GroupChatRoomResponse 포맷으로 매핑
        postId: r.id, // mock에서는 chatRoomId를 postId로 사용
        dDay: r.teamInfo?.dDay,
        isExpired: r.teamInfo?.isExpired ?? false,
        teamConfirmed: r.teamInfo?.teamConfirmed ?? false,
        currentCount: r.teamInfo?.currentCount,
        totalCount: r.teamInfo?.totalCount,
        members: r.teamInfo?.members.map((m) => ({
          id: m.id ?? null,
          name: m.name,
          isHost: m.isHost ?? false,
          filled: m.filled,
        })),
        statusLabel: r.teamInfo?.statusLabel,
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

  // ─── 인증 ───────────────────────────────────────────────────────────────────
  '/auth/logout': () => null,
  '/auth/withdraw': () => null,

  // ─── 마이페이지 ─────────────────────────────────────────────────────────────
  '/users/me': () => dummyMyProfile,
  '/users/matching-profile': () => dummyMatchingProfile,
  '/users/matching-profile/latest-submission': () => dummyMatchingProfile,
  '/users/matching-status': () => null,
  '/users/contest-registrations': () => dummyContestRegistrations,
  '/users/my-applications': () => dummyPostApplications,
  '/users/liked-posts': () => dummyLikedPosts,
  '/users/posts': () => dummyRecruitPosts.map(mapRecruitPostToListItem),
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

  // GET /contests/my-participations — 내가 후보 등록한 공모전 ID 목록
  '/contests/my-participations': () => ({ contestIds: Array.from(mockParticipantContestIds) }),

  // GET /users/reviews/received — 내가 받은 리뷰 전체 집계 (마이페이지 "리뷰 확인")
  '/users/reviews/received': () => ({
    averageRating: 4.3,
    totalCount: 2,
    reviews: [
      {
        totalRating: 5,
        responseSpeed: '1시간 이내',
        deadlineCompletion: '항상 제때',
        participationIntensity: '적극적 참여',
        keywords: ['리더십이 있어요', '아이디어가 넘쳐요'],
        comment: '팀장님 덕분에 좋은 팀 분위기에서 공모전을 마칠 수 있었어요.',
        createdAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
      },
      {
        totalRating: 4,
        responseSpeed: '1시간 이내',
        deadlineCompletion: '항상 제때',
        participationIntensity: '소극적 참여',
        keywords: ['책임감 있어요', '꼼꼼하게 작업해요'],
        comment: '꼼꼼하게 프로젝트를 이끌어줘서 좋았어요.',
        createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      },
    ],
  }),
};

// ─── 동적 라우트: 경로 파라미터 포함 ──────────────────────────────────────────
// ※ 순서 중요 — 더 구체적인 패턴이 앞에 와야 함

const dynamicRoutes: Array<[RegExp, (path: string, method: string, body?: unknown) => unknown]> = [
  // GET/PATCH /users/notification-settings
  [
    /^\/users\/notification-settings$/,
    (path, method, body) => {
      if (method === 'PATCH') {
        Object.assign(dummyNotificationSettings, body as Partial<typeof dummyNotificationSettings>);
      }
      return dummyNotificationSettings;
    },
  ],

  // PATCH /users/notifications/read-all
  [
    /^\/users\/notifications\/read-all$/,
    () => {
      dummyNotifications.forEach((n) => { n.isRead = true; });
      return null;
    },
  ],

  // GET /contests/:id — ContestDetail 포맷으로 반환
  [
    /^\/contests\/(\d+)$/,
    (path) => {
      const id = Number(path.split('/')[2]);
      const detail = dummyContestDetails.find((d) => d.contestId === id);
      if (detail) {
        return {
          contestId: detail.contestId,
          title: detail.title,
          organizer: detail.organizer,
          category: detail.category,
          target: detail.targetAudience,
          recruitField: detail.fields,
          prize: detail.prizeScale,
          startDate: detail.registrationPeriod?.split(' ~ ')[0]?.replace(/\./g, '-') ?? null,
          endDate: detail.endDate,
          linkUrl: detail.registrationUrl,
          content: (detail as any).content ?? null,
          imageUrl: (detail as any).imageUrl ?? null,
          dDay: detail.dDay,
        };
      }
      return dummyContests.find((c) => c.contestId === id) ?? null;
    },
  ],

  // GET /contests/:contestId/posts — 공모전별 모집글 목록
  [
    /^\/contests\/(\d+)\/posts$/,
    (path) => {
      const id = Number(path.split('/')[2]);
      return dummyRecruitPosts
        .filter((p) => p.contestId === id)
        .map((p) => ({
          postId: p.postId,
          contestId: p.contestId,
          chatRoomId: null,
          title: p.title,
          description: null,
          status: 'OPEN',
          recruitCount: p.totalMembers,
          deadline: null,
          onlineOffline: normalizeMeetingTypeForMock(p.meetingType),
          genderCondition: 'ANY',
          experienceCondition: p.experienceCondition,
          purposeCondition: p.purposeCondition,
          recruiterGender: 'FEMALE',
          skills: p.skills,
          region: p.location || null,
          createdAt: p.createdAt,
          currentMembers: p.currentMembers,
          ownerUserId: null,
          viewCount: p.views,
          likeCount: p.likeCount + (mockHeartedPostIds.has(p.postId) ? 1 : 0),
          commentCount: p.chatCount,
          applicantCount: Math.max(p.currentMembers - 1, 0),
        }));
    },
  ],

  // GET/PATCH/DELETE /posts/:postId — 모집글 단건 조회 / 수정 / 삭제
  [
    /^\/posts\/(\d+)$/,
    (path, method) => {
      if (method === 'DELETE' || method === 'PATCH') return null;
      const id = Number(path.split('/')[2]);
      const detail = dummyRecruitPostDetails.find((p) => p.postId === id);
      if (!detail) return null;
      return {
        postId: detail.postId,
        contestId: detail.contestId,
        chatRoomId: null,
        title: detail.title,
        description: detail.content,
        status: 'OPEN',
        recruitCount: detail.totalMembers,
        deadline: null,
        onlineOffline: normalizeMeetingTypeForMock(detail.meetingType),
        genderCondition: detail.genderCondition,
        schoolCondition: detail.schoolCondition,
        genderConditionLabel: detail.genderConditionLabel ?? detail.genderCondition,
        schoolConditionLabel: detail.schoolConditionLabel ?? detail.schoolCondition,
        createdAt: detail.createdAt,
        ownerUserId: null,
        ownerNickname: detail.recruiter?.name ?? null,
        contestTitle: detail.contestName ?? null,
        viewCount: detail.views,
        likeCount: detail.likeCount + (mockHeartedPostIds.has(detail.postId) ? 1 : 0),
        commentCount: (detail.comments ?? []).filter((c) => !!c.content).length
          + (mockExtraComments[detail.postId]?.length ?? 0),
        isHearted: mockHeartedPostIds.has(detail.postId),
        // 백엔드 미지원 필드 — mock 전용으로 풍부한 화면 데이터를 그대로 내려줌
        teamName: detail.teamName,
        contestPeriod: detail.contestPeriod,
        skills: detail.skills,
        experienceCondition: detail.experienceCondition,
        purposeCondition: detail.purposeCondition,
        intensity: detail.intensity,
        location: detail.location,
        currentMembers: detail.currentMembers,
        members: detail.members,
        recruiter: detail.recruiter,
        comments: [...(detail.comments ?? []), ...(mockExtraComments[detail.postId] ?? [])],
      };
    },
  ],

  // POST /contests/{contestId}/participants — 매칭 후보 등록 / DELETE — 취소
  [
    /^\/contests\/(\d+)\/participants$/,
    (path, method) => {
      const id = Number(path.split('/')[2]);
      if (method === 'DELETE') {
        mockParticipantContestIds.delete(id);
      } else {
        mockParticipantContestIds.add(id);
      }
      return null;
    },
  ],

  // GET /contests/{contestId}/participants/me — 내 등록 여부 확인
  [
    /^\/contests\/(\d+)\/participants\/me$/,
    (path) => {
      const id = Number(path.split('/')[2]);
      return { isParticipant: mockParticipantContestIds.has(id) };
    },
  ],

  // POST /users/hearts/{targetUserId}, DELETE /users/hearts/{targetUserId}
  [/^\/users\/hearts\/\d+$/, () => null],

  // POST /users/contest-hearts/{contestId}, DELETE /users/contest-hearts/{contestId}
  [/^\/users\/contest-hearts\/\d+$/, () => null],

  // GET /posts — 전체 모집글 목록 (홈 모집글 섹션 + 탐색 모집글 탭 공용) / POST /posts — 모집글 생성
  [
    /^\/posts$/,
    (path, method) => {
      if (method === 'POST') {
        return {
          postId: Math.floor(Math.random() * 1000) + 100,
          chatRoomId: Math.floor(Math.random() * 1000) + 100,
          title: 'mock 모집글',
          status: 'OPEN',
          recruitCount: 4,
        };
      }
      const content = dummyRecruitPosts.map(mapRecruitPostToListItem);
      return { content, totalElements: content.length, totalPages: 1, currentPage: 0 };
    },
  ],

  // POST /posts/{postId}/applications — 지원하기
  [/^\/posts\/\d+\/applications$/, () => ({ applicationId: Date.now(), status: 'PENDING', chatRoomId: 5 })],

  // POST|DELETE /posts/{postId}/hearts — 모집글 좋아요 토글
  // (mock 라우터는 method를 구분해도 매 호출이 곧 1회 토글이므로 단순 토글로 충분)
  [
    /^\/posts\/(\d+)\/hearts$/,
    (path) => {
      const id = Number(path.split('/')[2]);
      if (mockHeartedPostIds.has(id)) {
        mockHeartedPostIds.delete(id);
      } else {
        mockHeartedPostIds.add(id);
      }
      return null;
    },
  ],

  // GET /posts/{postId}/comments — 댓글 목록 / POST /posts/{postId}/comments — 댓글 작성
  [
    /^\/posts\/(\d+)\/comments$/,
    (path, method, body) => {
      const id = Number(path.split('/')[2]);
      const detail = dummyRecruitPostDetails.find((p) => p.postId === id);
      const baseComments = (detail?.comments ?? []).filter((c) => !!c.content);
      const extra = mockExtraComments[id] ?? [];

      if (method === 'POST') {
        const req = (body ?? {}) as { content?: string; parentId?: number };
        const newComment = {
          commentId: Date.now(),
          authorName: '나',
          content: req.content ?? '',
          createdAt: '방금 전',
          isAuthor: false,
          isReply: !!req.parentId,
        };
        mockExtraComments[id] = [...extra, newComment];
        return newComment;
      }

      return [...baseComments, ...extra];
    },
  ],

  // GET /posts/{postId}/invitations — 보낸 초대장 목록 / POST — 초대장 보내기
  [
    /^\/posts\/\d+\/invitations$/,
    (path, method) => {
      if (method === 'GET') return [];
      return { invitationId: Date.now(), status: 'PENDING', chatRoomId: 5 };
    },
  ],

  // POST /users/invitations/{id}/decline, POST /users/invitations/{id}/accept
  [/^\/users\/invitations\/\d+\/(decline|accept)$/, () => null],

  // DELETE /posts/{postId}/invitations/{invitationId} — 초대 취소
  [/^\/posts\/\d+\/invitations\/\d+$/, () => null],

  // DELETE /users/careers/{careerItemId}
  [/^\/users\/careers\/\d+$/, () => null],

  // PATCH /users/careers/contests/{careerItemId} — 공모전 경력 수정
  [
    /^\/users\/careers\/contests\/(\d+)$/,
    (path, _method, body) => {
      const id = Number(path.split('/')[4]);
      const req = (body ?? {}) as {
        contestName?: string;
        roles?: string[];
        startDate?: string;
        endDate?: string;
        awardStatus?: string;
      };
      return {
        careerItemId: id,
        careerType: 'CONTEST',
        contestName: req.contestName ?? '',
        roles: req.roles ?? [],
        startDate: req.startDate ?? '',
        endDate: req.endDate ?? '',
        awardStatus: req.awardStatus ?? 'PARTICIPATED',
      };
    },
  ],

  // PATCH /users/careers/certificates/{careerItemId} — 자격증 경력 수정
  [
    /^\/users\/careers\/certificates\/(\d+)$/,
    (path, _method, body) => {
      const id = Number(path.split('/')[4]);
      const req = (body ?? {}) as { certName?: string; issuingOrg?: string; acquiredDate?: string };
      return {
        careerItemId: id,
        careerType: 'CERTIFICATE',
        certName: req.certName ?? '',
        issuingOrg: req.issuingOrg ?? '',
        acquiredDate: req.acquiredDate ?? '',
      };
    },
  ],

  // GET /users/{userId}/careers
  [/^\/users\/\d+\/careers$/, () => []],

  // GET /users/posts/{postId}/applicants
  [/^\/users\/posts\/\d+\/applicants$/, () => dummyPostApplicants],

  // GET /users/posts/{postId}/candidates
  [/^\/users\/posts\/\d+\/candidates$/, () => dummyPostApplicants.slice(0, 2)],

  // GET /users/posts/{postId}/candidates/all — 전체 후보(페이징)
  [
    /^\/users\/posts\/\d+\/candidates\/all$/,
    () => ({
      content: dummyPostApplicants,
      totalElements: dummyPostApplicants.length,
      totalPages: 1,
      currentPage: 0,
    }),
  ],

  // DELETE /users/my-applications/{applicationId} — 게시글 지원 취소
  [/^\/users\/my-applications\/\d+$/, () => null],

  // POST(제출)|DELETE(취소) /users/educations/{educationId}/verification
  [
    /^\/users\/educations\/\d+\/verification$/,
    (_path, method) => {
      if (method === 'DELETE') return null;
      return {
        status: 'PENDING',
        docType: 'ENROLLMENT_CERT',
        fileName: '재학증명서_2025.jpg',
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        rejectReason: null,
      };
    },
  ],

  // GET /users/{userId} — 유저 상세 프로필 (정확히 숫자 하나만 매칭, 하위 경로 제외)
  [
    /^\/users\/(\d+)$/,
    (path) => {
      const id = Number(path.split('/')[2]);
      const detail = dummyTalentDetails.find((d: any) => d.userId === id);
      if (detail) return detail;
      const base = dummyTalents.find((t: any) => t.userId === id);
      if (!base) return null;
      return {
        ...base,
        location: '',
        averageRating: 3.5,
        appealTitle: '',
        appealContent: '',
        skillsDisplay: base.skills.map((s: any) => s.skillName),
        contestExperienceDetail: '',
        intensityDetail: '',
        meetingPreference: '',
        teamVibeDetail: '',
        feedbackStyleDetail: '',
        leadershipDetail: '',
        contestHistory: [],
        certifications: [],
        reviewStats: { totalRating: '', responseSpeed: '', deadlineCompletion: '', participationIntensity: '' },
        reviewKeywords: [],
        teamReviews: [],
      };
    },
  ],

  // GET /users/{userId}/notifications
  [
    /^\/users\/\d+\/notifications$/,
    () => ({ content: dummyNotifications, unreadCount: dummyNotifications.filter((n) => !n.isRead).length }),
  ],

  // PATCH /matching/(applications|invitations)/{id}/accept → { groupChatRoomId }
  [/^\/matching\/(applications|invitations)\/\d+\/accept$/, () => ({ groupChatRoomId: 1 })],

  // PATCH /matching/(applications|invitations)/{id}/reject
  [/^\/matching\/(applications|invitations)\/\d+\/reject$/, () => null],

  // PATCH /posts/{postId}/confirm-team
  [/^\/posts\/\d+\/confirm-team$/, () => null],

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
export function getMockResponse<T>(endpoint: string, method: string = 'GET', body?: unknown): Promise<T> {
  const path = endpoint.split('?')[0];

  // 1. 정적 라우트 우선 탐색
  const staticHandler = staticRoutes[path];
  if (staticHandler) {
    return Promise.resolve(staticHandler() as T);
  }

  // 2. 동적 라우트 패턴 매칭
  for (const [pattern, handler] of dynamicRoutes) {
    if (pattern.test(path)) {
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      return Promise.resolve(handler(path, method, parsedBody) as T);
    }
  }

  return Promise.reject(
    new Error(
      `[MOCK] 등록되지 않은 엔드포인트: ${path}\n` +
        `mockRouter.ts의 staticRoutes 또는 dynamicRoutes에 mock 데이터를 추가해주세요.`,
    ),
  );
}
