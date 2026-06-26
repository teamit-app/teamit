import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { dummyContestDetails } from '../../../src/data/recruitmentPosts';
import { useMypageStore } from '../../../src/store/useMypageStore';
import { MatchingProfileData } from '../../../src/types/mypage';
import { toggleMatchingStatus } from '../../../src/services/mypageService';

// ── 표시용 변환 헬퍼 ──────────────────────────────────────────────────────────

const EXPERIENCE_LABELS: Record<0 | 1 | 2, string> = {
  0: '처음이에요, 함께 배우며 성장하고 싶어요',
  1: '경험은 있지만 더 발전하고 싶어요',
  2: '경험을 바탕으로 결과를 만들고 싶어요',
};

const INTENSITY_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: '주 1~3시간',
  2: '주 4~7시간',
  3: '주 8~14시간',
  4: '주 15시간 이상',
};

const ONLINE_OFFLINE_LABELS: Record<string, string> = {
  ONLINE: '온라인 위주',
  MIXED: '혼합형',
  OFFLINE: '오프라인 위주',
};

const TEAM_VIBE_LABELS = ['팀 분위기 최우선', '팀 분위기 우선', '균형 중시', '결과 우선', '결과 최우선'];
const FEEDBACK_LABELS = ['매우 부드럽게', '부드럽게', '상황에 따라요', '솔직하게', '매우 솔직하게'];

const LEADERSHIP_LABELS: Record<string, string> = {
  WANT: '리더 하고 싶어요',
  IF_NEEDED: '필요하면 할 수 있어요',
  DONT_WANT: '리더는 안 하고 싶어요',
};

function formatCard(p: MatchingProfileData) {
  const regionStr = p.regions.length > 0
    ? ` · ${p.regions[0].sido}${p.regions[0].sigungu ? ' ' + p.regions[0].sigungu : ''}`
    : '';
  return {
    skills: p.skills.join(', '),
    purpose: EXPERIENCE_LABELS[p.experienceLevel],
    intensity: INTENSITY_LABELS[p.intensityLevel],
    meetingPreference: `${ONLINE_OFFLINE_LABELS[p.onlineOfflinePref]}${regionStr}`,
    teamVibe: `${TEAM_VIBE_LABELS[p.teamVibe - 1]} / ${FEEDBACK_LABELS[p.feedbackStyle - 1]}`,
    leadership: LEADERSHIP_LABELS[p.leadershipPref],
    appealTitle: p.appealTitle,
    appealContent: p.appealContent,
  };
}

// ── CardRow ───────────────────────────────────────────────────────────────────

interface CardRowProps {
  label: string;
  value: string;
  multiline?: boolean;
  onPressEdit: () => void;
}

function CardRow({ label, value, multiline, onPressEdit }: CardRowProps) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.left}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={[rowStyles.value, multiline && rowStyles.valueMultiline]}>{value}</Text>
      </View>
      <TouchableOpacity onPress={onPressEdit} hitSlop={8} activeOpacity={0.7}>
        <Text style={rowStyles.editText}>수정</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ParticipateScreen() {
  const insets = useSafeAreaInsets();
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const id = Number(contestId);

  const { matchingProfile, loadMatchingProfile } = useMypageStore();
  const [isLoading, setIsLoading] = useState(true);

  const detail = dummyContestDetails.find((d) => d.contestId === id) ?? dummyContestDetails[0];

  useEffect(() => {
    loadMatchingProfile().then(() => {
      const profile = useMypageStore.getState().matchingProfile;
      if (!profile) {
        // 작성된 참여카드 없음 → 매칭 프로필 전체 질문지로 이동
        router.replace(
          `/profile/matching-profile?returnTo=participate&contestId=${id}` as never,
        );
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const editStep = (step: number) => {
    router.push(
      `/profile/matching-profile?mode=edit&startStep=${step}&returnTo=participate&contestId=${id}` as never,
    );
  };

  const handleSubmit = async () => {
    try {
      await toggleMatchingStatus(true);
    } catch (e) {
      console.error('[Participate] 매칭 활성화 실패:', e);
    }
    router.push(`/explore/participate-complete?contestId=${id}` as never);
  };

  if (isLoading || !matchingProfile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const card = formatCard(matchingProfile);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="참여 카드 확인" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>이렇게 등록할게요</Text>
        <Text style={styles.subtitle}>틀린 정보가 있으면 수정해 주세요</Text>

        <View style={styles.cardWrap}>
          <View style={styles.cardAccentBar} />
          <View style={styles.cardInner}>
            <Text style={styles.cardPreviewLabel}>참여 카드 미리보기</Text>
            <Text style={styles.cardContestTitle}>{detail.title}</Text>

            <View style={styles.divider} />

            <CardRow label="스킬" value={card.skills} onPressEdit={() => editStep(1)} />
            <CardRow label="목적" value={card.purpose} onPressEdit={() => editStep(2)} />
            <CardRow label="강도" value={card.intensity} onPressEdit={() => editStep(3)} />
            <CardRow
              label="온오프라인선호"
              value={card.meetingPreference}
              onPressEdit={() => editStep(4)}
            />
            <CardRow label="팀분위기" value={card.teamVibe} onPressEdit={() => editStep(5)} />
            <CardRow label="리더십" value={card.leadership} onPressEdit={() => editStep(6)} />

            {/* 어필글 */}
            <View style={rowStyles.row}>
              <View style={rowStyles.left}>
                <Text style={rowStyles.label}>어필글</Text>
                <Text style={rowStyles.appealTitle}>제목: {card.appealTitle}</Text>
                <Text style={rowStyles.appealContent}>내용: {card.appealContent}</Text>
              </View>
              <TouchableOpacity onPress={() => editStep(7)} hitSlop={8} activeOpacity={0.7}>
                <Text style={rowStyles.editText}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>제출하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.dark, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.gray, marginBottom: 20 },
  cardWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },
  cardAccentBar: { height: 5, backgroundColor: Colors.primary },
  cardInner: { paddingTop: 16 },
  cardPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  cardContestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  left: { flex: 1 },
  label: { fontSize: 12, color: Colors.grayMedium, marginBottom: 5 },
  value: { fontSize: 14, color: Colors.dark, lineHeight: 20 },
  valueMultiline: { lineHeight: 21 },
  editText: { fontSize: 14, fontWeight: '500', color: Colors.primary, marginTop: 1 },
  appealTitle: { fontSize: 14, color: Colors.dark, lineHeight: 21, marginBottom: 4 },
  appealContent: { fontSize: 14, color: Colors.dark, lineHeight: 21 },
});
