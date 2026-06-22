import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { dummyRecruitPostDetails } from '../../../../src/data/recruitmentPosts';
import { dummyCandidates } from '../../../../src/data/candidates';
import { useRecruitPostStore } from '../../../../src/store/useRecruitPostStore';

/* ─── 참여 정보 행 ─── */
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

/* ─── 온도 진행 바 ─── */
function TempBar({ value, max = 40 }: { value: number; max?: number }) {
  return (
    <View style={s.barWrap}>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${(value / max) * 100}%` as any }]} />
      </View>
      <View style={s.barScale}>
        <Text style={s.barScaleText}>0</Text>
        <Text style={s.barScaleText}>{max}</Text>
      </View>
    </View>
  );
}

/* ─── 통계 행 ─── */
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.statRow}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

/* ─── 메인 화면 ─── */
export default function RecruiterProfileScreen() {
  const insets = useSafeAreaInsets();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [hearted, setHearted] = useState(false);

  const userPosts = useRecruitPostStore((s) => s.userPosts);
  const id = Number(postId);
  const post =
    userPosts.find((p) => p.postId === id) ??
    dummyRecruitPostDetails.find((p) => p.postId === id) ??
    dummyRecruitPostDetails[0];

  const { recruiter } = post;

  // 프로토타입: 온도·학교·성별·리뷰 등 부재 필드는 dummyCandidates[0] 로 보완
  const mock = dummyCandidates[0];

  const KEYWORD_SHOW = 3;
  const extraKeywords = mock.reviewKeywords.length - KEYWORD_SHOW;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>

      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={s.headerSide}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>상세 정보</Text>
        <View style={s.headerSide} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 프로필 카드 ── */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarEmoji}>👑</Text>
          </View>

          <View style={s.profileInfo}>
            <View style={s.nameRow}>
              <Text style={s.name}>{recruiter.name}</Text>
              <Text style={s.gender}> {mock.gender}</Text>
              <View style={s.tempPill}>
                <Text style={s.tempPillText}>{mock.temperature}°C</Text>
              </View>
            </View>
            <View style={s.schoolRow}>
              <Text style={s.school}>{mock.school}</Text>
              {mock.isVerified && (
                <View style={s.verifiedDot}>
                  <Text style={s.verifiedCheck}>✓</Text>
                </View>
              )}
            </View>
            <Text style={s.location}>
              📍 {recruiter.location || mock.location}
            </Text>
          </View>

          <TouchableOpacity onPress={() => setHearted((p) => !p)} hitSlop={8} style={s.heartBtn}>
            <Text style={[s.heartIcon, hearted && s.heartIconFilled]}>
              {hearted ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 참여 정보 ── */}
        <Text style={s.sectionTitle}>참여 정보</Text>
        <View style={s.card}>
          <InfoRow label="보유 기술" isFirst>
            <View style={s.pillRow}>
              {(recruiter.skills.length > 0 ? recruiter.skills : mock.skills).map((sk) => (
                <View key={sk} style={s.skillPill}>
                  <Text style={s.skillPillText}>{sk}</Text>
                </View>
              ))}
            </View>
          </InfoRow>
          <InfoRow label="공모전 참여 경험">
            <Text style={s.infoValue}>{recruiter.experienceCount || mock.contestExperienceDetail}</Text>
          </InfoRow>
          <InfoRow label="참여 강도">
            <Text style={s.infoValue}>{recruiter.intensity || mock.intensity}</Text>
          </InfoRow>
          <InfoRow label="온오프라인선호">
            <Text style={s.infoValue}>
              {recruiter.meetingType || mock.meetingType}
              {(recruiter.location || mock.location)
                ? ` · ${recruiter.location || mock.location}`
                : ''}
            </Text>
          </InfoRow>
          <InfoRow label="팀 분위기">
            <Text style={s.infoValue}>{recruiter.teamVibe || mock.teamVibe}</Text>
          </InfoRow>
          <InfoRow label="리더십">
            <Text style={s.infoValue}>{recruiter.leadershipStyle || mock.leadershipStyle}</Text>
          </InfoRow>
        </View>

        {/* ── 경험 ── */}
        {(mock.contestHistory.length > 0 || mock.certifications.length > 0) && (
          <>
            <Text style={s.sectionTitle}>경험</Text>
            {mock.contestHistory.map((item, i) => (
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
            {mock.certifications.map((cert, i) => (
              <View key={i} style={[s.card, s.expCard]}>
                <Text style={s.expTypeLabel}>자격증</Text>
                <Text style={s.expTitle}>{cert.name}</Text>
                <Text style={s.expRole}>취득일: {cert.acquiredDate}</Text>
              </View>
            ))}
          </>
        )}

        {/* ── 리뷰 ── */}
        <Text style={s.sectionTitle}>리뷰</Text>

        {/* 리뷰 통합 카드 */}
        <View style={s.card}>
          {/* 티밋 온도 */}
          <Text style={s.tempCardLabel}>티밋 온도</Text>
          <View style={s.tempScoreRow}>
            <Text style={s.tempScore}>{mock.temperature}</Text>
            <Text style={s.tempScoreMax}> / 40</Text>
          </View>
          <TempBar value={mock.temperature} />
          <View style={s.statDivider} />
          <StatRow label="총평" value={mock.reviewStats.totalRating} />
          <StatRow label="응답 속도" value={mock.reviewStats.responseSpeed} />
          <StatRow label="마감 완수" value={mock.reviewStats.deadlineCompletion} />
          <StatRow label="참여 강도" value={mock.reviewStats.participationIntensity} />

          {/* 키워드 pills */}
          {mock.reviewKeywords.length > 0 && (
            <>
              <View style={s.reviewInnerDivider} />
              <View style={s.keywordRow}>
                {mock.reviewKeywords.slice(0, KEYWORD_SHOW).map((kw) => (
                  <View key={kw.text} style={s.keywordPill}>
                    <Text style={s.keywordText}>{kw.text} {kw.count}</Text>
                  </View>
                ))}
                {extraKeywords > 0 && (
                  <View style={s.keywordPill}>
                    <Text style={s.keywordText}>+{extraKeywords}</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* 팀원 리뷰 */}
          {mock.teamReviews.length > 0 && (
            <>
              <View style={s.reviewInnerDivider} />
              <View style={s.reviewHeader}>
                <Text style={s.reviewHeaderTitle}>💬 팀원 리뷰</Text>
                <Text style={s.reviewCount}>{mock.teamReviews.length}개</Text>
              </View>
              {mock.teamReviews.map((r, i) => (
                <View key={i} style={[s.reviewItem, i > 0 && s.reviewItemBorder]}>
                  <Text style={s.reviewContent}>"{r.content}"</Text>
                  <Text style={s.reviewReviewer}>{r.reviewer}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },

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

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },

  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },

  infoRow: { paddingHorizontal: 16, paddingVertical: 13, gap: 6 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
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

  tempCardLabel: {
    fontSize: 14, fontWeight: '700', color: Colors.dark,
    paddingHorizontal: 16, paddingTop: 16, marginBottom: 4,
  },
  tempScoreRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, marginBottom: 10,
  },
  tempScore: { fontSize: 52, fontWeight: '700', color: Colors.primary, lineHeight: 56 },
  tempScoreMax: { fontSize: 18, color: Colors.grayMedium, marginBottom: 6 },
  barWrap: { marginHorizontal: 16, marginBottom: 8 },
  barTrack: {
    height: 10, backgroundColor: Colors.lightGray,
    borderRadius: 5, overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  barScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  barScaleText: { fontSize: 11, color: Colors.grayLight },
  statDivider: { height: 1, backgroundColor: '#F0F0F0', marginTop: 4 },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F7F7F7',
  },
  statLabel: { fontSize: 13, color: Colors.grayMedium, width: 72 },
  statValue: { fontSize: 13, color: Colors.dark, flex: 1, textAlign: 'right' },

  reviewInnerDivider: { height: 1, backgroundColor: '#F0F0F0' },

  keywordRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    padding: 16,
  },
  keywordPill: {
    backgroundColor: Colors.ogTint, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  keywordText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  reviewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  reviewHeaderTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  reviewCount: { fontSize: 13, color: Colors.grayMedium },
  reviewItem: { paddingHorizontal: 16, paddingVertical: 14 },
  reviewItemBorder: { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  reviewContent: { fontSize: 14, color: Colors.dark, lineHeight: 22, marginBottom: 5 },
  reviewReviewer: { fontSize: 12, color: Colors.grayMedium },
});
