import { create } from 'zustand';
import { RecruitPostDetail } from '../types/contest';

interface RecruitPostState {
  userPosts: RecruitPostDetail[];
  nextId: number;
  addPost: (post: Omit<RecruitPostDetail, 'postId'>) => void;
}

export const useRecruitPostStore = create<RecruitPostState>((set) => ({
  userPosts: [],
  nextId: 100,
  addPost: (post) =>
    set((s) => ({
      userPosts: [{ ...post, postId: s.nextId }, ...s.userPosts],
      nextId: s.nextId + 1,
    })),
}));
