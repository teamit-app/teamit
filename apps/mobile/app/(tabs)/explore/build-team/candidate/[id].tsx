import React, { useState, useEffect } from 'react';
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
import { Colors } from '../../../../../src/constants/colors';
import { EDUCATION_STATUS_LABEL } from '../../../../../src/constants/education';
import { getUserDetail } from '../../../../../src/services/talentService';
import { useAuthStore } from '../../../../../src/store/useAuthStore';
import { useExploreStore } from '../../../../../src/store/useExploreStore';
import { TalentDetail } from '../../../../../src/types/talent';
import { ReviewStatsCard } from '../../../../../src/components/profile/ReviewStatsCard';

const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';
const GENDER_LABEL: Record<string, string> = { MALE: '남성', FEMALE: '여성' };

/* ─── 섹션 타이틀 ─── */
function SectionTitle({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

/* ─── 참여 정보 행 (첫 행은 상단 구분선 없음) ─── */
function InfoRow({
  label,
  isFirst,
  children,
}: {
  label: string;
  isFirst?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[s.infoRow, !isFirst && s.infoRowBorder]}>
      <Text style={s.infoLabel}>{label}</Text>
      {children}
    </View>
  );
}

/* ─── 메인 화면 ─── */
export default function CandidateDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [hearted, setHearted] = useState(false);
  const [detail, setDetail] = useState<TalentDetail | null>(null);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const toggleTalentHeartInStore = useExploreStore((s) => s.toggleTalentHeart);

  useEffect(() => {
    if (IS_MOCK) {
      // mock 모드: 인재풀 상세정보와 동일한 더미 데이터 사용
      import('../../../../../src/data/talents').then(({ dummyTalentDetails }) => {
        const found = dummyTalentDetails.find((d) => d.userId === Number(id)) ?? dummyTalentDetails[0];
        setDetail(found);
        setHearted(found.isHearted);
      });
    } else {
      // 서버 모드: 후보자 목록에서 넘어온 id는 실제 userId — 인재풀 상세정보와 동일한 API 사용
      getUserDetail(Number(id))
        .then((d) => {
          setDetail(d);
          setHearted(d.isHearted);
        })
        .catch(console.error);
    }
  }, [id]);

  // 인재풀 하트와 동일한 대상 — 여기서 좋아요를 눌러도 탐색 > 인재풀 상세정보에 그대로 반영된다
  const handleToggleHeart = async () => {
    if (!detail) return;
    const prev = hearted;
    setHearted(!prev);
    try {
      await toggleTalentHeartInStore(detail.userId, prev);
    } catch (e) {
      console.error('[CandidateDetail] 하트 처리 실패:', e);
      setHearted(prev);
    }
  };

  if (!detail) {
    return (
      <View style={[s.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>

      {/* ── 헤더 ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={s.headerSide}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>상세 정보</Text>
        <View style={s.headerSide} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 프로필 카드 (하트 우측) ── */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarEmoji}>🧑‍💻</Text>
          </View>

          <View style={s.profileInfo}>
            <View style={s.nameRow}>
              <Text style={s.name}>{detail.nickname}</Text>
              <Text style={s.gender}> {GENDER_LABEL[detail.gender]}</Text>
              <View style={s.tempPill}>
                <Text style={s.tempPillText}>★ {detail.averageRating.toFixed(1)}</Text>
              </View>
            </View>
            <View style={s.schoolRow}>
              <Text style={s.school}>
                {detail.schoolName} {detail.major}
                {detail.status ? ` · ${EDUCATION_STATUS_LABEL[detail.status]}` : ''}
              </Text>
              {detail.verified && (
                <View style={s.verifiedDot}>
                  <Text style={s.verifiedCheck}>✓</Text>
                </View>
              )}
            </View>
            <Text style={s.location}>📍 {detail.location}</Text>
          </View>

          {/* 하트: 프로필 카드 우측 상단 */}
          <TouchableOpacity
            onPress={handleToggleHeart}
            hitSlop={8}
            style={s.heartBtn}
          >
            <Text style={[s.heartIcon, hearted && s.heartIconFilled]}>
              {hearted ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 어필글 카드 ── */}
        <View style={s.appealCard}>
          <Text style={s.appealLabel}>어필글</Text>
          <Text style={s.appealTitle}>{detail.appealTitle}</Text>
          <Text style={s.appealBody}>{detail.appealContent}</Text>
        </View>

        {/* ── 참여 정보 ── */}
        <SectionTitle title="참여 정보" />
        <View style={s.card}>
          <InfoRow label="보유 기술" isFirst>
            <View style={s.pillRow}>
              {detail.skillsDisplay.map((sk) => (
                <View key={sk} style={s.skillPill}>
                  <Text style={s.skillPillText}>{sk}</Text>
                </View>
              ))}
            </View>
          </InfoRow>
          <InfoRow label="공모전 참여 경험 및 목적">
            <Text style={s.infoValue}>{detail.contestExperienceDetail}</Text>
          </InfoRow>
          <InfoRow label="참여 강도">
            <Text style={s.infoValue}>{detail.intensityDetail}</Text>
          </InfoRow>
          <InfoRow label="온오프라인선호">
            <Text style={s.infoValue}>{detail.meetingPreference}</Text>
          </InfoRow>
          <InfoRow label="팀 분위기">
            <Text style={s.infoValue}>{detail.teamVibeDetail}</Text>
          </InfoRow>
          <InfoRow label="피드백 방식">
            <Text style={s.infoValue}>{detail.feedbackStyleDetail}</Text>
          </InfoRow>
          <InfoRow label="리더십">
            <Text style={s.infoValue}>{detail.leadershipDetail}</Text>
          </InfoRow>
        </View>

        {/* ── 경험 ── */}
        {(detail.contestHistory.length > 0 || detail.certifications.length > 0) && (
          <>
            <SectionTitle title="경험" />
            {detail.contestHistory.map((item, i) => (
              <View key={i} style={[s.card, s.expCard]}>
                <Text style={s.expTypeLabel}>공모전</Text>
                <View style={s.expTitleRow}>
                  <Text style={s.expTitle}>{item.title}</Text>
                  {item.award && (
                    <View style={s.awardPill}>
                      <Text style={s.awardPillText}>{item.award}</Text>
                    </View>
                  )}
                </View>
                <Text style={s.expRole}>역할 : {item.role}</Text>
              </View>
            ))}
            {detail.certifications.map((cert, i) => (
              <View key={i} style={[s.card, s.expCard]}>
                <Text style={s.expTypeLabel}>자격증</Text>
                <Text style={s.expTitle}>{cert.name}</Text>
                <Text style={s.expRole}>취득일: {cert.acquiredDate}</Text>
              </View>
            ))}
          </>
        )}

        {/* ── 리뷰 ── */}
        <SectionTitle title="리뷰" />
        <ReviewStatsCard
          averageRating={detail.averageRating}
          stats={[
            { label: '총평', value: detail.reviewStats.totalRating },
            { label: '응답 속도', value: detail.reviewStats.responseSpeed },
            { label: '마감 완수', value: detail.reviewStats.deadlineCompletion },
            { label: '참여 강도', value: detail.reviewStats.participationIntensity },
          ].filter((row) => row.value !== '')}
          keywords={detail.reviewKeywords}
          reviewCount={detail.teamReviews.length}
          comments={detail.teamReviews.slice(0, 3)}
          onPressReviews={() =>
            router.push({
              pathname: '/explore/all-reviews' as never,
              params: { userId: detail.userId.toString() },
            })
          }
        />

        <View style={{ height: 24 }} />
      </ScrollView>

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },

  /* 헤더 */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerSide: { width: 32 },
  backIcon: { fontSize: 28, color: Colors.primary, lineHeight: 32 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.dark },

  scroll: { paddingBottom: 32 },

  /* 프로필 카드 */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 30 },
  profileInfo: { flex: 1, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  gender: { fontSize: 13, color: Colors.grayMedium },
  tempPill: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tempPillText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  school: { fontSize: 13, color: Colors.gray },
  verifiedDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: { fontSize: 8, color: Colors.white, fontWeight: '900' },
  location: { fontSize: 13, color: Colors.gray },
  heartBtn: { alignSelf: 'flex-start', paddingTop: 2 },
  heartIcon: { fontSize: 22, color: Colors.grayMedium },
  heartIconFilled: { color: Colors.primary },

  /* 어필글 카드 */
  appealCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: 16,
    gap: 6,
  },
  appealLabel: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  appealTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  appealBody: { fontSize: 14, color: Colors.gray, lineHeight: 22 },

  /* 섹션 타이틀 */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },

  /* 공통 카드 */
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },

  /* 참여 정보 행 */
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 6,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  infoLabel: { fontSize: 12, color: Colors.grayMedium },
  infoValue: { fontSize: 14, color: Colors.dark, lineHeight: 20 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillPill: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  skillPillText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  /* 경험 카드 */
  expCard: { marginBottom: 8, padding: 16 },
  expTypeLabel: { fontSize: 12, color: Colors.grayMedium, marginBottom: 6 },
  expTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  expTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark, flex: 1 },
  awardPill: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  awardPillText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  expRole: { fontSize: 13, color: Colors.gray },
});
