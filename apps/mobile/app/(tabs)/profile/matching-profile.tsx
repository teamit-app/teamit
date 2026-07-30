import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from '../../../src/utils/alert';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { RegionPickerModal } from '../../../src/components/common/RegionPickerModal';
import { useMypageStore } from '../../../src/store/useMypageStore';
import { updateMyTalentSkills } from '../../../src/hooks/useExploreData';
import { useAuthStore } from '../../../src/store/useAuthStore';
import {
  LeadershipPref,
  MatchingProfileData,
  OnlineOfflinePref,
  UserRegion,
} from '../../../src/types/mypage';
import { formatRegionsLabel } from '../../../src/utils/region';
import { TEAM_VIBE_LABELS, FEEDBACK_LABELS } from '../../../src/constants/matchingLabels';
import { registerAsParticipant } from '../../../src/services/contestService';
import { trackEvent } from '../../../src/services/gtm';

// ─── Constants ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7;

const SKILL_CATEGORIES: Record<string, string[]> = {
  전체: [],
  디자인: ['Figma', 'Photoshop', 'Illustrator', 'XD', 'Sketch', 'Canva', 'After Effects', 'Zeplin'],
  // 세부 기술 스택을 잘 모르는 사람도 고를 수 있도록 상위 개념의 범용 항목을 함께 제공한다
  개발: ['개발', '프론트엔드 개발', '백엔드 개발', 'AI', 'React', 'React Native', 'Vue', 'Next.js', 'Flutter', 'iOS', 'Android', 'Spring', 'Node.js', 'Python', 'Django', 'Java', 'TypeScript', 'Kotlin', 'Swift'],
  데이터: ['SQL', 'Python', 'R', 'Tableau', 'Power BI', 'Excel', '데이터 분석', 'Pandas', 'TensorFlow'],
  기획: ['기획', 'PM', 'UX Research', 'Notion', 'Jira', 'GA/GTM', 'PPT', 'Slack'],
  마케팅: ['마케팅', '퍼포먼스 마케팅', '콘텐츠 마케팅', 'SNS 운영', '브랜드 마케팅', 'GA4', '메타 광고관리자', '카피라이팅'],
};

const ALL_SKILLS: string[] = Array.from(
  new Set(
    Object.entries(SKILL_CATEGORIES)
      .filter(([key]) => key !== '전체')
      .flatMap(([, skills]) => skills),
  ),
);

const CATEGORY_KEYS = Object.keys(SKILL_CATEGORIES);

const EXPERIENCE_OPTIONS: {
  value: 0 | 1 | 2;
  title: string;
  desc: string;
}[] = [
  { value: 0, title: '0회', desc: '' },
  { value: 1, title: '1~3회', desc: '' },
  { value: 2, title: '4회 이상', desc: '' },
];

const PURPOSE_OPTIONS: {
  value: 'EXPERIENCE' | 'AWARD';
  title: string;
  desc: string;
}[] = [
  { value: 'EXPERIENCE', title: '경험', desc: '새로운 경험을 쌓고 싶어요' },
  { value: 'AWARD', title: '수상', desc: '결과로 이어지는 성과를 내고 싶어요' },
];

const INTENSITY_OPTIONS: {
  value: 1 | 2 | 3 | 4;
  title: string;
  desc: string;
}[] = [
  { value: 1, title: '주 1~3시간', desc: '가볍게: 부담 없이 참여하고 싶어요' },
  { value: 2, title: '주 4~7시간', desc: '적당하게: 꾸준히 참여할 수 있어요' },
  { value: 3, title: '주 8~14시간', desc: '적극적으로: 적극적으로 참여할 수 있어요' },
  { value: 4, title: '주 15시간 이상', desc: '몰입해서: 프로젝트를 우선순위로 두고 집중할 수 있어요' },
];

const ONLINE_OFFLINE_OPTIONS: {
  value: OnlineOfflinePref;
  icon: string;
  label: string;
  sub: string;
}[] = [
  { value: 'ONLINE', icon: '💻', label: '온라인 위주', sub: '비대면으로 편하게' },
  { value: 'MIXED', icon: '🤝', label: '혼합형', sub: '필요시 대면 가능' },
  { value: 'OFFLINE', icon: '📍', label: '오프라인 위주', sub: '직접 만나서 작업' },
];

const LEADERSHIP_OPTIONS: {
  value: LeadershipPref;
  title: string;
  desc: string;
}[] = [
  { value: 'WANT', title: '리더 하고 싶어요', desc: '팀을 이끌고 방향을 잡고 싶어요' },
  { value: 'IF_NEEDED', title: '필요하면 할 수 있어요', desc: '상황에 따라 유연하게 맡을게요' },
  { value: 'DONT_WANT', title: '리더는 안 하고 싶어요', desc: '팀원으로서 최선을 다할게요' },
];

// ─── Radio Card ──────────────────────────────────────────────────────────────

function RadioCard({
  selected,
  title,
  desc,
  onPress,
}: {
  selected: boolean;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[rc.card, selected && rc.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={rc.textCol}>
        <Text style={[rc.title, selected && rc.titleSelected]}>{title}</Text>
        <Text style={rc.desc}>{desc}</Text>
      </View>
      <View style={[rc.radio, selected && rc.radioSelected]}>
        {selected && <View style={rc.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

const rc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.ogTint,
  },
  textCol: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 2 },
  titleSelected: { color: Colors.primary },
  desc: { fontSize: 13, color: Colors.gray },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioSelected: { borderColor: Colors.primary },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: Colors.primary,
  },
});

// ─── Scale Selector ──────────────────────────────────────────────────────────

const HANDLE_SIZE = 22;
const TRACK_H = 4;

function ScaleSelector({
  value,
  onChange,
  title,
  leftLabel,
  leftDesc,
  rightLabel,
  rightDesc,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  title: string;
  leftLabel: string;
  leftDesc: string;
  rightLabel: string;
  rightDesc: string;
  labels: string[];
}) {
  const [trackW, setTrackW] = useState(0);
  const stateRef = useRef({ trackW: 0, onChange });
  stateRef.current = { trackW, onChange };

  const getValueFromX = (x: number, w: number) => {
    const innerW = w - HANDLE_SIZE;
    const relX = x - HANDLE_SIZE / 2;
    const ratio = Math.max(0, Math.min(1, relX / innerW));
    return Math.round(ratio * 4) + 1;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { trackW: w, onChange: cb } = stateRef.current;
        if (w === 0) return;
        cb(getValueFromX(evt.nativeEvent.locationX, w));
      },
      onPanResponderMove: (evt) => {
        const { trackW: w, onChange: cb } = stateRef.current;
        if (w === 0) return;
        cb(getValueFromX(evt.nativeEvent.locationX, w));
      },
    })
  ).current;

  const ratio = (value - 1) / 4;
  const innerW = Math.max(0, trackW - HANDLE_SIZE);
  const fillW = ratio * innerW;
  const handleLeft = ratio * innerW;

  return (
    <View style={ss.wrap}>
      <Text style={ss.cardTitle}>{title}</Text>

      {/* 레이블 행: 좌/우 굵은 레이블 */}
      <View style={ss.labelRow}>
        <Text style={ss.sideLabel}>{leftLabel}</Text>
        <Text style={[ss.sideLabel, ss.rightAlign]}>{rightLabel}</Text>
      </View>

      {/* 설명 행: 좌 설명 | VS | 우 설명 */}
      <View style={ss.descRow}>
        <Text style={[ss.sideDesc, ss.flex1]}>{leftDesc}</Text>
        <Text style={ss.vsText}>VS</Text>
        <Text style={[ss.sideDesc, ss.flex1, ss.rightAlign]}>{rightDesc}</Text>
      </View>

      {/* 드래그 가능한 슬라이더 트랙 */}
      <View
        style={ss.trackOuter}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackW(w);
          stateRef.current.trackW = w;
        }}
        {...panResponder.panHandlers}
      >
        <View style={ss.trackBg} />
        {trackW > 0 && (
          <View style={[ss.trackFill, { width: fillW + HANDLE_SIZE / 2 }]} />
        )}
        {trackW > 0 && (
          <View style={[ss.handle, { left: handleLeft }]} />
        )}
      </View>

      {/* 숫자 클릭으로도 선택 가능 */}
      <View style={ss.numbersRow}>
        {[1, 2, 3, 4, 5].map((v) => (
          <TouchableOpacity key={v} onPress={() => onChange(v)} activeOpacity={0.7}>
            <Text style={[ss.numText, value === v && ss.numActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 동적 레이블 필 */}
      <View style={ss.pillWrap}>
        <View style={ss.pill}>
          <Text style={ss.pillText}>{labels[value - 1]}</Text>
        </View>
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  flex1: { flex: 1 },
  rightAlign: { textAlign: 'right' },
  vsText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.grayMedium,
  },
  sideLabel: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  sideDesc: { fontSize: 11, color: Colors.gray, lineHeight: 16 },
  trackOuter: {
    height: HANDLE_SIZE + 8,
    position: 'relative',
    marginBottom: 4,
  },
  trackBg: {
    position: 'absolute',
    left: HANDLE_SIZE / 2,
    right: HANDLE_SIZE / 2,
    top: (HANDLE_SIZE + 8 - TRACK_H) / 2,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: Colors.lightGray,
  },
  trackFill: {
    position: 'absolute',
    left: HANDLE_SIZE / 2,
    top: (HANDLE_SIZE + 8 - TRACK_H) / 2,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: Colors.primary,
  },
  handle: {
    position: 'absolute',
    top: 4,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: HANDLE_SIZE / 2,
    marginTop: 4,
    marginBottom: 12,
  },
  numText: {
    fontSize: 12,
    color: Colors.grayMedium,
    textAlign: 'center',
    width: 16,
  },
  numActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  pillWrap: { alignItems: 'center' },
  pill: {
    backgroundColor: Colors.ogTint,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressHeader({ step }: { step: number }) {
  const pct = `${Math.round((step / TOTAL_STEPS) * 100)}%`;
  return (
    <View style={ph.wrap}>
      <Text style={ph.stepText}>{step} / {TOTAL_STEPS}</Text>
      <View style={ph.track}>
        <View style={[ph.fill, { width: pct as unknown as number }]} />
      </View>
    </View>
  );
}

const ph = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  stepText: { fontSize: 13, color: Colors.grayMedium, marginBottom: 8 },
  track: {
    height: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
});

// ─── Step Title ───────────────────────────────────────────────────────────────

function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={sth.wrap}>
      <Text style={sth.title}>{title}</Text>
      <Text style={sth.sub}>{sub}</Text>
    </View>
  );
}

const sth = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.dark, marginBottom: 6 },
  sub: { fontSize: 14, color: Colors.gray, lineHeight: 20 },
});

// ─── Region label helper ──────────────────────────────────────────────────────

function regionLabel(regions: UserRegion[]): string {
  return formatRegionsLabel(regions, '지역 선택');
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MatchingProfileScreen() {
  const insets = useSafeAreaInsets();
  const { matchingProfile, loadMatchingProfile, updateMatchingProfile } =
    useMypageStore();

  // URL params: mode=edit (단일 스텝 수정) | returnTo=participate|build-team | startStep | contestId
  const { mode, startStep, returnTo, contestId: contestParam } =
    useLocalSearchParams<{ mode?: string; startStep?: string; returnTo?: string; contestId?: string }>();

  const isEditMode = mode === 'edit';
  // 공모전 후보 등록/팀 직접 꾸리기/등록된 참여카드 수정 플로우 — 이 세 경로에서는
  // 절대 라이브 매칭 프로필(마이페이지)을 건드리지 않고, 이 플로우 전용 draftCard에만 저장한다.
  // 매칭 프로필은 오직 마이페이지에 직접 들어가서 편집할 때만 바뀌어야 하기 때문.
  const isContestFlow =
    returnTo === 'participate' || returnTo === 'build-team' || returnTo === 'participant-card';
  const totalSteps = returnTo === 'build-team' ? 6 : TOTAL_STEPS;
  const initialStep = isEditMode
    ? Math.min(Math.max(Number(startStep) || 1, 1), totalSteps)
    : 1;

  const [step, setStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [skillCategory, setSkillCategory] = useState('전체');
  const [skillSearch, setSkillSearch] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  // Step 2
  const [experienceLevel, setExperienceLevel] = useState<0 | 1 | 2>(0);
  const [participationPurpose, setParticipationPurpose] =
    useState<'EXPERIENCE' | 'AWARD'>('EXPERIENCE');

  // Step 3
  const [intensityLevel, setIntensityLevel] = useState<1 | 2 | 3 | 4>(2);

  // Step 4
  const [onlineOfflinePref, setOnlineOfflinePref] =
    useState<OnlineOfflinePref>('MIXED');
  const [regions, setRegions] = useState<UserRegion[]>([]);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  // Step 5
  const [teamVibe, setTeamVibe] = useState(3);
  const [feedbackStyle, setFeedbackStyle] = useState(3);

  // Step 6
  const [leadershipPref, setLeadershipPref] =
    useState<LeadershipPref>('IF_NEEDED');

  // Step 7
  const [appealTitle, setAppealTitle] = useState('');
  const [appealContent, setAppealContent] = useState('');

  const applyCardToForm = (mp: MatchingProfileData) => {
    setSkills(mp.skills);
    setExperienceLevel(mp.experienceLevel);
    setParticipationPurpose(mp.participationPurpose ?? 'EXPERIENCE');
    setIntensityLevel(mp.intensityLevel);
    setOnlineOfflinePref(mp.onlineOfflinePref);
    setRegions(mp.regions ?? []);
    setTeamVibe(mp.teamVibe);
    setFeedbackStyle(mp.feedbackStyle);
    setLeadershipPref(mp.leadershipPref);
    setAppealTitle(mp.appealTitle);
    setAppealContent(mp.appealContent);
  };

  // Load existing profile
  useEffect(() => {
    if (isContestFlow) {
      // 이 플로우에서 이전에 편집해둔 draft가 있으면 그걸 우선 쓰고, 없으면 라이브
      // 프로필을 "시작 템플릿"으로 한 번 복사해온다(이후 저장해도 라이브엔 안 반영됨).
      const draft = useMypageStore.getState().draftCard;
      if (draft) {
        applyCardToForm(draft);
        return;
      }
      loadMatchingProfile().then(() => {
        const mp = useMypageStore.getState().matchingProfile;
        if (mp) applyCardToForm(mp);
      });
      return;
    }
    loadMatchingProfile().then(() => {
      const mp = useMypageStore.getState().matchingProfile;
      if (mp) applyCardToForm(mp);
    });
  }, []);

  // edit mode: 탭 간 화면 재사용 시 URL params 변경을 step에 반영
  useEffect(() => {
    if (isEditMode) {
      const s = Math.min(Math.max(Number(startStep) || 1, 1), totalSteps);
      setStep(s);
    }
  }, [mode, startStep]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = skillSearch.trim();
    if (!trimmed) {
      Alert.alert('직접 추가', '검색창에 추가할 기술을 입력한 뒤 눌러주세요.');
      return;
    }
    if (!skills.includes(trimmed)) toggleSkill(trimmed);
    setSkillSearch('');
  };

  const displayedSkills: string[] = skillSearch.trim()
    ? ALL_SKILLS.filter((s) =>
        s.toLowerCase().includes(skillSearch.toLowerCase()),
      )
    : skillCategory === '전체'
    ? ALL_SKILLS
    : (SKILL_CATEGORIES[skillCategory] ?? []);

  // 오프라인/혼합을 골랐으면 활동 지역은 필수 — 실제로 이 지역 기준으로 후보/모집자를
  // 매칭하기 때문에 지역 없이 넘어가게 두면 안 된다.
  const regionRequiredButMissing =
    onlineOfflinePref !== 'ONLINE' && regions.length === 0;
  const step4Invalid = step === 4 && regionRequiredButMissing;

  const goNext = () => {
    // isEditMode 화면은 이 함수 자체를 호출하지 않으므로(취소/저장 버튼만 있음),
    // 여기서 발생하는 이벤트는 항상 "처음부터 순서대로 진행 중"인 경우만 해당한다.
    trackEvent('profile_step_complete', { step, source: returnTo ?? 'mypage' });
    setStep((s) => Math.min(s + 1, totalSteps));
  };
  const goPrev = () => {
    if (isEditMode) {
      navigateAfterAction();
    } else if (step === 1) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  };

  const navigateAfterAction = () => {
    if (returnTo === 'participate') {
      router.replace(`/explore/participate?contestId=${contestParam}` as never);
    } else if (returnTo === 'build-team') {
      router.replace(`/explore/build-team/${contestParam}` as never);
    } else if (returnTo === 'mypage-card') {
      if (isEditMode) {
        router.back();
      } else {
        router.replace('/profile/matching-profile-card' as never);
      }
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const data: MatchingProfileData = {
      skills,
      experienceLevel,
      participationPurpose,
      intensityLevel,
      onlineOfflinePref,
      regions,
      teamVibe,
      feedbackStyle,
      leadershipPref,
      appealTitle: appealTitle.trim(),
      appealContent: appealContent.trim(),
    };
    try {
      if (isContestFlow) {
        // 라이브 매칭 프로필은 절대 안 건드리고, 이 플로우 전용 draft에만 담아둔다.
        useMypageStore.getState().setDraftCard(data);
        // 이미 등록된 참여카드를 수정하는 경우엔 그 공모전 스냅샷만 즉시 갱신
        if (returnTo === 'participant-card' && contestParam) {
          await registerAsParticipant(Number(contestParam), data).catch(() => {});
        }
      } else {
        await updateMatchingProfile(data);
        // 탐색 탭 인재풀 목록·마이페이지는 세션 내내 캐시되는 값이라, 여기서 저장만 하고
        // 끝내면 상세정보 화면(매번 새로 조회)과 다르게 스킬이 수정 전 상태로 계속 보인다.
        const currentUserId = useAuthStore.getState().currentUserId;
        if (currentUserId) {
          updateMyTalentSkills(currentUserId, skills);
        }
        useMypageStore.getState().reloadProfile();
      }
      // isEditMode(단일 스텝 수정)는 위저드를 처음부터 끝까지 마친 게 아니므로 완료가 아니라
      // 별도의 "수정 저장" 이벤트로 집계한다.
      if (isEditMode) {
        trackEvent('profile_edit_save', { step, source: returnTo ?? 'mypage' });
      } else {
        trackEvent('profile_final_step_complete', { source: returnTo ?? 'mypage' });
      }
      navigateAfterAction();
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="매칭 프로필" onBack={goPrev} />
      <ProgressHeader step={step} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── STEP 1: 기술 스택 ─────────────────────────── */}
        {step === 1 && (
          <View>
            <StepHeader
              title="활용 가능한 기술 스택을 알려주세요"
              sub="사용할 수 있는 기술을 모두 선택해 주세요"
            />

            {/* 검색창 */}
            <View style={styles.searchWrap}>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 기술 검색... (예: SQL, React, Figma)"
                placeholderTextColor={Colors.grayMedium}
                value={skillSearch}
                onChangeText={setSkillSearch}
              />
            </View>

            {/* 카테고리 탭 */}
            {!skillSearch.trim() && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catScrollContent}
                style={styles.catScroll}
              >
                {CATEGORY_KEYS.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      skillCategory === cat && styles.catChipActive,
                    ]}
                    onPress={() => setSkillCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        skillCategory === cat && styles.catChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* 스킬 칩 그리드 */}
            <View style={styles.skillGrid}>
              {displayedSkills.map((skill) => {
                const selected = skills.includes(skill);
                return (
                  <TouchableOpacity
                    key={skill}
                    style={[
                      styles.skillChip,
                      selected && styles.skillChipSelected,
                    ]}
                    onPress={() => toggleSkill(skill)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.skillChipText,
                        selected && styles.skillChipTextSelected,
                      ]}
                    >
                      {skill}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* 직접 추가하기 */}
              <TouchableOpacity
                style={styles.skillChipAdd}
                onPress={handleAddCustomSkill}
                activeOpacity={0.7}
              >
                <Text style={styles.skillChipAddText}>직접 추가하기</Text>
              </TouchableOpacity>
            </View>

            {/* 선택한 스킬 프리뷰 */}
            {skills.length > 0 && (
              <View style={styles.selectedSkillsWrap}>
                <Text style={styles.selectedSkillsLabel}>
                  선택한 스킬 ({skills.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedSkillsRow}
                >
                  {skills.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={styles.selectedSkillPill}
                      onPress={() => toggleSkill(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.selectedSkillPillText}>
                        {s} ×
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* ── STEP 2: 참여 경험 및 목적 ─────────────────────────── */}
        {step === 2 && (
          <View>
            <StepHeader
              title="공모전 참여 경험은 어느 정도인가요?"
              sub="선호하는 경험대의 팀원을 찾는 데 활용돼요"
            />
            <View style={styles.cardSection}>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  selected={experienceLevel === opt.value}
                  title={opt.title}
                  desc={opt.desc}
                  onPress={() => setExperienceLevel(opt.value)}
                />
              ))}
            </View>

            <StepHeader
              title="이번 공모전 참여 목적은 무엇인가요?"
              sub="비슷한 목적의 팀원을 찾는 데 활용돼요"
            />
            <View style={styles.cardSection}>
              {PURPOSE_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  selected={participationPurpose === opt.value}
                  title={opt.title}
                  desc={opt.desc}
                  onPress={() => setParticipationPurpose(opt.value)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── STEP 3: 참여 강도 ─────────────────────────── */}
        {step === 3 && (
          <View>
            <StepHeader
              title="프로젝트에 얼마나 집중할 수 있나요?"
              sub="프로젝트에 투자할 수 있는 시간을 알려주세요"
            />
            <View style={styles.cardSection}>
              {INTENSITY_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  selected={intensityLevel === opt.value}
                  title={opt.title}
                  desc={opt.desc}
                  onPress={() => setIntensityLevel(opt.value)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── STEP 4: 온오프라인 ─────────────────────────── */}
        {step === 4 && (
          <View>
            <StepHeader
              title="어떻게 협업하고 싶으세요?"
              sub="선호하는 협업 방식을 선택해 주세요"
            />
            <View style={styles.onoffSection}>
              {ONLINE_OFFLINE_OPTIONS.map((opt) => {
                const selected = onlineOfflinePref === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.onoffCard,
                      selected && styles.onoffCardSelected,
                    ]}
                    onPress={() => setOnlineOfflinePref(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.onoffIcon}>{opt.icon}</Text>
                    <Text
                      style={[
                        styles.onoffLabel,
                        selected && styles.onoffLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.onoffSub}>{opt.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {(onlineOfflinePref === 'MIXED' ||
              onlineOfflinePref === 'OFFLINE') && (
              <View style={styles.regionSection}>
                <TouchableOpacity
                  style={[styles.regionRow, regionRequiredButMissing && styles.regionRowRequired]}
                  onPress={() => setShowRegionPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.regionText}>
                    📍 {regionLabel(regions)}
                    {regions.length === 0 ? ' *' : ''}
                  </Text>
                  <Text style={styles.regionEdit}>수정</Text>
                </TouchableOpacity>
                {regionRequiredButMissing && (
                  <Text style={styles.regionRequiredHint}>
                    오프라인·혼합은 이 지역을 기준으로 매칭돼요. 활동 지역을 선택해 주세요.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── STEP 5: 협업 스타일 ──────────────────────── */}
        {step === 5 && (
          <View>
            <StepHeader
              title="선호하는 팀 분위기는 어떤가요?"
              sub="양 극단 사이에서 나의 위치를 선택해 주세요"
            />
            <View style={styles.cardSection}>
              <ScaleSelector
                value={teamVibe}
                onChange={setTeamVibe}
                title="함께 일할 때 무엇이 더 중요한가요?"
                leftLabel="좋은 팀 분위기"
                leftDesc={"편안하게 소통하며\n함께 성장해요"}
                rightLabel="좋은 결과"
                rightDesc={"목표 달성과 완성도를\n중요하게 생각해요"}
                labels={TEAM_VIBE_LABELS}
              />
              <ScaleSelector
                value={feedbackStyle}
                onChange={setFeedbackStyle}
                title="어떤 피드백 방식을 선호하나요?"
                leftLabel="부드럽게"
                leftDesc={"기분 상하지 않게\n전달해주면 좋아요"}
                rightLabel="솔직하게"
                rightDesc={"돌려 말하지 않고\n바로 말해줘도 괜찮아요"}
                labels={FEEDBACK_LABELS}
              />
            </View>
          </View>
        )}

        {/* ── STEP 6: 리더십 선호 ───────────────────────── */}
        {step === 6 && (
          <View>
            <StepHeader
              title="리더 역할에 대해 어떻게 생각하나요?"
              sub="가장 가까운 생각을 선택해주세요"
            />
            <View style={styles.cardSection}>
              {LEADERSHIP_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  selected={leadershipPref === opt.value}
                  title={opt.title}
                  desc={opt.desc}
                  onPress={() => setLeadershipPref(opt.value)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── STEP 7: 어필 글 ──────────────────────────── */}
        {step === 7 && (
          <View>
            <StepHeader
              title="나를 어필할 한마디를 남겨주세요"
              sub="모집자에게 노출되는 소개글이에요"
            />

            {/* 제목 */}
            <View style={styles.appealCard}>
              <View style={styles.appealLabelRow}>
                <Text style={styles.appealLabel}>제목</Text>
                <Text style={styles.charCount}>
                  {appealTitle.length} / 50자
                </Text>
              </View>
              <TextInput
                style={styles.appealTitleInput}
                placeholder="예) 저는 금융권 데이터 분석 경력자입니다"
                placeholderTextColor={Colors.grayMedium}
                value={appealTitle}
                onChangeText={setAppealTitle}
                maxLength={50}
              />
            </View>

            {/* 본문 */}
            <View style={styles.appealCard}>
              <View style={styles.appealLabelRow}>
                <Text style={styles.appealLabel}>본문</Text>
                <Text style={styles.charCount}>
                  {appealContent.length} / 300자
                </Text>
              </View>
              <TextInput
                style={styles.appealContentInput}
                placeholder="저에 대해 자유롭게 소개해주세요"
                placeholderTextColor={Colors.grayMedium}
                value={appealContent}
                onChangeText={setAppealContent}
                maxLength={300}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            {/* 작성 가이드 */}
            <View style={styles.guideSection}>
              <Text style={styles.guideSectionTitle}>작성 가이드</Text>
              {[
                { emoji: '💪', title: '관심 분야', desc: '어떤 분야에 관심이 있는지 알려주세요!' },
                { emoji: '✅', title: '희망 직무', desc: '어떤 직무를 희망하고 있는지 적어주세요!' },
                { emoji: '🔥', title: '소프트 스킬', desc: '발표 역량, 일정 관리 능력 등 업무 수행 시 본인의 강점을 작성해 주세요!' },
              ].map((item) => (
                <View key={item.title} style={styles.guideItem}>
                  <Text style={styles.guideEmoji}>{item.emoji}</Text>
                  <View style={styles.guideTexts}>
                    <Text style={styles.guideItemTitle}>{item.title}</Text>
                    <Text style={styles.guideItemDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        {/* ── 하단 버튼 ─────────────────────────────────── */}
        <View style={[styles.footer, { marginBottom: insets.bottom + 8 }]}>
          {isEditMode ? (
            // 단일 스텝 수정 모드: 취소 + 저장
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={navigateAfterAction}>
                <Text style={styles.prevBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, (saving || step4Invalid) && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving || step4Invalid}
              >
                <Text style={styles.nextBtnText}>{saving ? '저장 중...' : '저장'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {step === 1 && (
                <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
                  <Text style={styles.nextBtnText}>다음으로</Text>
                </TouchableOpacity>
              )}
              {step >= 2 && step <= totalSteps - 1 && (
                <View style={styles.footerRow}>
                  <TouchableOpacity style={styles.prevBtn} onPress={goPrev}>
                    <Text style={styles.prevBtnText}>이전</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nextBtn, step4Invalid && styles.btnDisabled]}
                    onPress={goNext}
                    disabled={step4Invalid}
                  >
                    <Text style={styles.nextBtnText}>다음으로</Text>
                  </TouchableOpacity>
                </View>
              )}
              {step === totalSteps && (
                // 마지막 단계엔 "건너뛰기"를 두지 않는다 — 저장(setDraftCard/updateMatchingProfile)
                // 없이 건너뛰면 returnTo 화면(참여하기/팀 꾸리기)이 "참여카드 없음"으로 판단해
                // 이 질문지 1단계로 다시 돌려보내는 무한 루프가 생겼었다. "완료"만 동작하게 한다.
                <View style={styles.footerRow}>
                  <TouchableOpacity style={styles.prevBtn} onPress={goPrev}>
                    <Text style={styles.prevBtnText}>이전</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nextBtn, saving && styles.btnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    <Text style={styles.nextBtnText}>{saving ? '저장 중...' : '완료'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <RegionPickerModal
        visible={showRegionPicker}
        initialRegions={regions}
        onConfirm={(r) => {
          setRegions(r);
          setShowRegionPicker(false);
        }}
        onCancel={() => setShowRegionPicker(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  scrollContent: { paddingBottom: 24 },

  // Search (step 1)
  searchWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },
  searchInput: { fontSize: 14, color: Colors.dark },

  // Category chips (step 1)
  catScroll: { marginBottom: 4 },
  catScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.pageBg,
  },
  catChipActive: { backgroundColor: Colors.primary },
  catChipText: { fontSize: 13, color: Colors.gray, fontWeight: '500' },
  catChipTextActive: { color: Colors.white, fontWeight: '700' },

  // Skill chips (step 1)
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  skillChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.ogTint,
  },
  skillChipText: { fontSize: 13, color: Colors.dark },
  skillChipTextSelected: { color: Colors.primary, fontWeight: '600' },
  skillChipAdd: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    borderStyle: 'dashed',
  },
  skillChipAddText: { fontSize: 13, color: Colors.grayMedium },

  // Selected skills preview
  selectedSkillsWrap: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  selectedSkillsLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 8,
  },
  selectedSkillsRow: { gap: 6 },
  selectedSkillPill: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedSkillPillText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },

  // Generic card section padding
  cardSection: { paddingHorizontal: 16, paddingTop: 8 },

  // Online/offline cards (step 4)
  onoffSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    paddingTop: 8,
  },
  onoffCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
  },
  onoffCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.ogTint,
  },
  onoffIcon: { fontSize: 22, marginBottom: 6 },
  onoffLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray,
    marginBottom: 3,
    textAlign: 'center',
  },
  onoffLabelSelected: { color: Colors.primary },
  onoffSub: {
    fontSize: 11,
    color: Colors.grayMedium,
    textAlign: 'center',
  },

  // Region picker row (step 4)
  regionSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  regionRowRequired: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
  },
  regionText: { fontSize: 14, color: Colors.dark },
  regionEdit: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  regionRequiredHint: {
    fontSize: 12,
    color: Colors.primary,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },

  // Appeal cards (step 7)
  appealCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  appealLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appealLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  charCount: { fontSize: 12, color: Colors.grayMedium },
  appealTitleInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.dark,
  },
  appealContentInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.dark,
    minHeight: 120,
  },

  // Guide section (step 7)
  guideSection: {
    marginHorizontal: 16,
    marginTop: 8,
    gap: 16,
  },
  guideSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guideEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  guideTexts: { flex: 1 },
  guideItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 3,
  },
  guideItemDesc: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 19,
  },

  // Footer buttons
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  footerRow: { flexDirection: 'row', gap: 10 },
  prevBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  prevBtnText: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  nextBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  btnDisabled: { opacity: 0.6 },
});
