import { apiRequest } from './api';
import { PostComment, RecruitPost, RecruitPostDetail } from '../types/contest';

export interface CreatePostRequest {
  title: string;
  description?: string;
  contestId?: number;
  recruitCount?: number;
  deadline?: string;
  onlineOffline?: string;
  genderCondition?: string;
  schoolCondition?: string;
}

export interface CreatePostResponse {
  postId: number;
  chatRoomId: number;
  title: string;
  status: string;
  recruitCount?: number;
}

export const createPost = async (request: CreatePostRequest): Promise<CreatePostResponse> => {
  return apiRequest<CreatePostResponse>('/posts', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

export const confirmTeam = async (postId: number): Promise<void> => {
  await apiRequest<null>(`/posts/${postId}/confirm-team`, { method: 'PATCH' });
};

export interface PostListItem {
  postId: number;
  contestId?: number;
  chatRoomId?: number;
  title: string;
  description?: string;
  status: string;
  recruitCount?: number;
  deadline?: string;
  onlineOffline?: string;
  genderCondition?: string;
  experienceCondition?: string;
  purposeCondition?: string;
  genderConditionLabel?: string;
  schoolConditionLabel?: string;
  recruiterGender?: string;
  skills?: string[];
  region?: string;
  createdAt?: string;
  // 모집자 본인을 포함한 현재 실제 팀원 수
  currentMembers?: number;
  ownerUserId?: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  applicantCount?: number;
  contestTitle?: string;
}

export interface PostMemberInfo {
  id?: number;
  name: string;
  isHost: boolean;
  filled: boolean;
}

export interface RecruiterProfileInfo {
  name: string;
  skills: string[];
  experienceCount: string;
  intensity: string;
  meetingType: string;
  location: string;
  teamVibe: string;
  feedbackStyle: string;
  leadershipStyle: string;
}

export interface PostDetail extends PostListItem {
  schoolCondition?: string;
  ownerNickname?: string;
  contestTitle?: string;
  contestPeriod?: string;
  currentMembers?: number;
  members?: PostMemberInfo[];
  recruiter?: RecruiterProfileInfo;
  isHearted?: boolean;
  isApplied?: boolean;
  myApplicationId?: number | null;
  // 아직 백엔드가 제공하지 않는 필드 — mock에서만 채워짐
  teamName?: string;
  intensity?: string;
  location?: string;
  comments?: PostComment[];
}

export const getPostsByContest = async (contestId: number): Promise<PostListItem[]> => {
  return apiRequest<PostListItem[]>(`/contests/${contestId}/posts`);
};

export const getMyPosts = async (): Promise<PostListItem[]> => {
  return apiRequest<PostListItem[]>('/users/posts');
};

export interface PostListParams {
  sort?: 'LATEST' | 'POPULAR';
  keyword?: string;
  page?: number;
  size?: number;
}

interface PostPageResponse {
  content: PostListItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export const getPosts = async (params?: PostListParams): Promise<PostListItem[]> => {
  const query = new URLSearchParams();
  query.set('sort', params?.sort ?? 'LATEST');
  if (params?.keyword) query.set('keyword', params.keyword);
  query.set('page', String(params?.page ?? 0));
  query.set('size', String(params?.size ?? 20));
  const data = await apiRequest<PostPageResponse>(`/posts?${query.toString()}`);
  return data.content;
};

export interface PostPageResult {
  content: PostListItem[];
  currentPage: number;
  totalPages: number;
}

// 탐색 탭 무한스크롤 전용 — getPosts와 달리 totalPages/currentPage까지 그대로 반환한다
// (getPosts는 홈 화면처럼 배열만 필요한 곳에서 계속 쓰이므로 반환 타입을 바꾸지 않는다)
export const getPostsPage = async (params?: PostListParams): Promise<PostPageResult> => {
  const query = new URLSearchParams();
  query.set('sort', params?.sort ?? 'LATEST');
  if (params?.keyword) query.set('keyword', params.keyword);
  query.set('page', String(params?.page ?? 0));
  query.set('size', String(params?.size ?? 10));
  const data = await apiRequest<PostPageResponse>(`/posts?${query.toString()}`);
  return { content: data.content, currentPage: data.currentPage, totalPages: data.totalPages };
};

// PostListItem → RecruitPost 변환
// 모집글 목록을 카드로 보여주는 화면(홈 모집글 섹션, 탐색 모집글 탭, 공모전 상세)은
// 전부 이 함수를 통해서만 변환해야 함 — 각자 따로 매핑하면 필드 누락으로 화면끼리 어긋남
export function adaptToRecruitPost(p: PostListItem): RecruitPost {
  return {
    postId: p.postId,
    contestId: p.contestId ?? 0,
    title: p.title,
    createdAt: p.createdAt ?? '',
    views: p.viewCount ?? 0,
    chatCount: p.commentCount ?? 0,
    likeCount: p.likeCount ?? 0,
    skills: p.skills ?? [],
    experienceCondition: p.experienceCondition ?? '',
    meetingType: p.onlineOffline ?? '',
    location: p.region ?? '',
    // 매칭 프로필 전용 개념이라 모집글에는 해당 데이터가 없음
    intensity: '',
    genderCondition: p.genderCondition,
    recruiterGender: p.recruiterGender,
    currentMembers: p.currentMembers ?? 1,
    totalMembers: p.recruitCount ?? 0,
    isHearted: false,
    ownerUserId: p.ownerUserId,
    status: p.status,
    contestTitle: p.contestTitle,
  };
}

export const getPostDetail = async (postId: number): Promise<PostDetail> => {
  return apiRequest<PostDetail>(`/posts/${postId}`);
};

// PostDetail(BE 응답) → RecruitPostDetail(화면 표시용) 변환
// 모집글 상세를 보여주는 화면(explore/post/[postId].tsx, invitation-detail 등)은
// 전부 이 함수를 통해서만 변환해야 함 — 각자 따로 매핑하면 필드 누락으로 화면끼리 어긋남
export function adaptToRecruitPostDetail(d: PostDetail): RecruitPostDetail {
  return {
    postId: d.postId,
    contestId: d.contestId ?? 0,
    title: d.title,
    createdAt: d.createdAt ?? '',
    views: d.viewCount ?? 0,
    chatCount: d.commentCount ?? 0,
    likeCount: d.likeCount ?? 0,
    skills: d.skills ?? [],
    experienceCondition: d.experienceCondition ?? '',
    purposeCondition: d.purposeCondition ?? '',
    genderConditionLabel: d.genderConditionLabel ?? '',
    schoolConditionLabel: d.schoolConditionLabel ?? '',
    meetingType: d.onlineOffline ?? '',
    location: d.location ?? '',
    intensity: d.intensity ?? '',
    currentMembers: d.currentMembers ?? 1,
    totalMembers: d.recruitCount ?? 0,
    isHearted: d.isHearted ?? false,
    ownerUserId: d.ownerUserId,
    status: d.status,
    teamName: d.teamName ?? d.title,
    contestName: d.contestTitle ?? '',
    contestPeriod: d.contestPeriod ?? '',
    content: d.description ?? '',
    members: (d.members ?? []).map((m: PostMemberInfo, idx: number) => ({
      memberId: m.id ?? -(idx + 1),
      name: m.name,
      isHost: m.isHost,
      isRecruiting: !m.filled,
    })),
    genderCondition: d.genderCondition ?? '',
    schoolCondition: d.schoolCondition ?? '',
    recruiter: d.recruiter ?? {
      name: d.ownerNickname ?? '',
      skills: [],
      experienceCount: '',
      intensity: '',
      meetingType: d.onlineOffline ?? '',
      location: '',
      teamVibe: '',
      feedbackStyle: '',
      leadershipStyle: '',
    },
    comments: d.comments ?? [],
  };
}

export const addPostHeart = async (postId: number): Promise<void> => {
  await apiRequest<null>(`/posts/${postId}/hearts`, { method: 'POST' });
};

export const removePostHeart = async (postId: number): Promise<void> => {
  await apiRequest<null>(`/posts/${postId}/hearts`, { method: 'DELETE' });
};

export const getPostComments = async (postId: number): Promise<PostComment[]> => {
  return apiRequest<PostComment[]>(`/posts/${postId}/comments`);
};

export const addPostComment = async (
  postId: number,
  content: string,
  parentId?: number
): Promise<PostComment> => {
  return apiRequest<PostComment>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parentId }),
  });
};

export interface ApplyPostResponse {
  applicationId: number;
  status: string;
  chatRoomId: number | null;
}

export const applyToPost = async (postId: number, appealText?: string): Promise<ApplyPostResponse> => {
  return apiRequest<ApplyPostResponse>(`/posts/${postId}/applications`, {
    method: 'POST',
    body: JSON.stringify({ appealText: appealText ?? '' }),
  });
};

export interface UpdatePostRequest {
  title: string;
  description?: string;
  // 아래 필드들은 아직 합류한 팀원이 없는 모집글에서만 서버가 반영한다(팀원이 있으면 무시됨)
  recruitCount?: number;
  onlineOffline?: string;
  genderCondition?: string;
  schoolCondition?: string;
  experienceCondition?: string;
  purposeCondition?: string;
  requiredSkills?: { skillId: number | null; skillNameCustom: string }[];
}

export const updatePost = async (
  postId: number,
  data: UpdatePostRequest
): Promise<void> => {
  await apiRequest<null>(`/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deletePost = async (postId: number): Promise<void> => {
  await apiRequest<null>(`/posts/${postId}`, { method: 'DELETE' });
};
