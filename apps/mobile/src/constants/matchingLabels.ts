export const EXPERIENCE_LABELS: Record<0 | 1 | 2, string> = {
  0: '0회',
  1: '1~3회',
  2: '4회 이상',
};

export const PURPOSE_LABELS: Record<'EXPERIENCE' | 'AWARD', string> = {
  EXPERIENCE: '경험',
  AWARD: '수상',
};

export const INTENSITY_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: '주 1~3시간',
  2: '주 4~7시간',
  3: '주 8~14시간',
  4: '주 15시간 이상',
};

export const ONLINE_OFFLINE_LABELS: Record<string, string> = {
  ONLINE: '온라인 위주',
  MIXED: '온오프라인 모두 가능',
  OFFLINE: '오프라인 위주',
};

export const TEAM_VIBE_LABELS: string[] = [
  '팀 분위기 최우선',
  '팀 분위기 우선',
  '균형 중시',
  '결과 우선',
  '결과 최우선',
];

export const FEEDBACK_LABELS: string[] = [
  '매우 부드럽게',
  '부드럽게',
  '상황에 따라요',
  '솔직하게',
  '매우 솔직하게',
];

export const LEADERSHIP_LABELS: Record<string, string> = {
  WANT: '리더 하고 싶어요',
  IF_NEEDED: '필요하면 할 수 있어요',
  DONT_WANT: '리더는 안 하고 싶어요',
};

export function formatMatchingCard(p: {
  experienceLevel: number | null;
  intensityLevel: number | null;
  onlineOfflinePref: string | null;
  region: string;
  teamVibe: number | null;
  feedbackStyle: number | null;
  leadershipPref: string | null;
  participationPurpose?: string | null;
  appealTitle: string;
  appealContent: string;
  skills: string[];
}) {
  const regionSuffix = p.region ? ` · ${p.region}` : '';
  const onlineLabel = p.onlineOfflinePref ? (ONLINE_OFFLINE_LABELS[p.onlineOfflinePref] ?? p.onlineOfflinePref) : '';
  const isOffline = p.onlineOfflinePref === 'OFFLINE' || p.onlineOfflinePref === 'MIXED';

  return {
    skills: p.skills.join(', '),
    experience: p.experienceLevel != null ? (EXPERIENCE_LABELS[p.experienceLevel as 0 | 1 | 2] ?? '') : '',
    purpose: p.participationPurpose ? (PURPOSE_LABELS[p.participationPurpose as 'EXPERIENCE' | 'AWARD'] ?? '') : '',
    intensity: p.intensityLevel != null ? (INTENSITY_LABELS[p.intensityLevel as 1 | 2 | 3 | 4] ?? '') : '',
    meetingPreference: isOffline ? `${onlineLabel}${regionSuffix}` : onlineLabel,
    teamVibe:
      p.teamVibe != null && p.feedbackStyle != null
        ? `${TEAM_VIBE_LABELS[p.teamVibe - 1] ?? ''} / ${FEEDBACK_LABELS[p.feedbackStyle - 1] ?? ''}`
        : '',
    leadership: p.leadershipPref ? (LEADERSHIP_LABELS[p.leadershipPref] ?? '') : '',
    appealTitle: p.appealTitle,
    appealContent: p.appealContent,
  };
}
