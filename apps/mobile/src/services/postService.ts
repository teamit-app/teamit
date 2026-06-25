import { apiRequest } from './api';
import { RecruitPost, RecruitPostDetail } from '../types/contest';

export const getPostsByContest = (contestId: number): Promise<RecruitPost[]> =>
  apiRequest<RecruitPost[]>(`/contests/${contestId}/posts`);

export const getPostDetail = (postId: number): Promise<RecruitPostDetail> =>
  apiRequest<RecruitPostDetail>(`/posts/${postId}`);
