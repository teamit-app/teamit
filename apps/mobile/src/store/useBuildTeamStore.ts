import { create } from 'zustand';

interface BuildTeamState {
  contestId: number | null;
  recruitCount: number;
  requiredSkills: string[];
  genderCondition: string;
  schoolCondition: string;
  meetingType: string;
  experienceCondition: string;
  postTitle: string;
  postContent: string;

  setContestId: (id: number) => void;
  setRecruitCount: (n: number) => void;
  toggleSkill: (skill: string) => void;
  setGenderCondition: (v: string) => void;
  setSchoolCondition: (v: string) => void;
  setMeetingType: (v: string) => void;
  setExperienceCondition: (v: string) => void;
  setPostTitle: (v: string) => void;
  setPostContent: (v: string) => void;
  reset: () => void;
}

const defaultState = {
  contestId: null,
  recruitCount: 2,
  requiredSkills: [],
  genderCondition: '상관없음',
  schoolCondition: '학교 상관없음',
  meetingType: '혼합',
  experienceCondition: '공모전 경험 무관',
  postTitle: '',
  postContent: '',
};

export const useBuildTeamStore = create<BuildTeamState>((set) => ({
  ...defaultState,

  setContestId: (id) => set({ contestId: id }),
  setRecruitCount: (n) => set({ recruitCount: n }),
  toggleSkill: (skill) =>
    set((s) => ({
      requiredSkills: s.requiredSkills.includes(skill)
        ? s.requiredSkills.filter((sk) => sk !== skill)
        : [...s.requiredSkills, skill],
    })),
  setGenderCondition: (v) => set({ genderCondition: v }),
  setSchoolCondition: (v) => set({ schoolCondition: v }),
  setMeetingType: (v) => set({ meetingType: v }),
  setExperienceCondition: (v) => set({ experienceCondition: v }),
  setPostTitle: (v) => set({ postTitle: v }),
  setPostContent: (v) => set({ postContent: v }),
  reset: () => set(defaultState),
}));
