import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { dummyTalentDetails } from '../../../../src/data/talents';
import { getOrCreateDirectChatRoom } from '../../../../src/services/messageService';
import { TalentRecruitPost } from '../../../../src/types/talent';

const GENDER_LABEL: Record<string, string> = { MALE: '남성', FEMALE: '여성' };
const KEYWORD_SHOW = 4;

// ── 소섹션 타이틀 ──────────────────────────────────────────────────────────────
function SectionTitle({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

// ── 참여 정보 행 ───────────────────────────────────────────────────────────────
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

// ── 온도 진행 바 ───────────────────────────────────────────────────────────────
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

// ── 통계 행 ───────────────────────────────────────────────────────────────────
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.statRow}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

// ── 모집글 카드 ───────────────────────────────────────────────────────────────
function RecruitPostCard({ post }: { post: TalentRecruitPost }) {
  return (
    <TouchableOpacity
      style={s.recruitCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push(`/explore/post/${post.postId}` as never)
      }
    >
      <View style={s.recruitTopRow}>
        <Text style={s.recruitViews}>조회 {post.views}</Text>
        <Text style={s.recruitDate}>{post.createdAt}</Text>
      </View>
      <Text style={s.recruitTitle}>{post.title}</Text>
      <View style={s.pillRow}>
        {post.skills.map((sk) => (
          <View key={sk} style={s.skillPill}>
            <Text style={s.skillPillText}>{sk}</Text>
          </View>
        ))}
      </View>
      <View style={s.recruitMetaRow}>
        <Text style={s.recruitMeta}>{post.experienceCondition}</Text>
        <Text style={s.recruitMetaDot}> · </Text>
        <Text style={s.recruitMeta}>
          {post.meetingType}
          {post.location ? ` ${post.location}` : ''}
        </Text>
        <Text style={s.recruitMetaDot}> · </Text>
        <Text style={s.recruitMeta}>{post.intensity}</Text>
      </View>
      <View style={s.recruitBottomRow}>
        <Text style={s.recruitTeamCount}>
          팀원 {post.currentMembers}/{post.totalMembers}명 모집 중
        </Text>
        <View style={s.recruitIcons}>
          <Text style={s.recruitIconText}>💬 {post.chatCount}</Text>
          <Text style={s.recruitIconText}>♥ {post.likeCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function TalentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [hearted, setHearted] = useState(false);

  const detail = dummyTalentDetails.find((d) => d.userId === Number(userId))
    ?? dummyTalentDetails[0];

  const extraKeywords = detail.reviewKeywords.length - KEYWORD_SHOW;

  const handleChat = async () => {
    try {
      const chatRoomId = await getOrCreateDirectChatRoom(detail.userId);
      router.push(`/messages/${chatRoomId}` as never);
    } catch {
      // 채팅방 생성 실패 시 무시
    }
  };

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
          <View style={s.profileTop}>
            <View style={s.avatar}>
              <Text style={s.avatarEmoji}>🧑‍💻</Text>
            </View>

            <View style={s.profileInfo}>
              <View style={s.nameRow}>
                <Text style={s.name}>{detail.nickname}</Text>
                <Text style={s.gender}>{GENDER_LABEL[detail.gender]}</Text>
                <View style={s.tempPill}>
                  <Text style={s.tempPillText}>{detail.temperature}°C</Text>
                </View>
              </View>
              <View style={s.schoolRow}>
                <Text style={s.school}>{detail.schoolName} {detail.major}</Text>
                {detail.verified && (
                  <View style={s.verifiedDot}>
                    <Text style={s.verifiedCheck}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={s.location}>📍 {detail.location}</Text>
            </View>

            {/* 우측: 하트 + 채팅하기 pill */}
            <View style={s.rightActions}>
              <TouchableOpacity
                onPress={() => setHearted((p) => !p)}
                hitSlop={8}
                style={s.heartBtn}
              >
                <Text style={[s.heartIcon, hearted && s.heartIconFilled]}>
                  {hearted ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.chatPill} onPress={handleChat} activeOpacity={0.85}>
                <Text style={s.chatPillText}>채팅하기</Text>
              </TouchableOpacity>
            </View>
          </View>
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
          <InfoRow label="공모전 참여 경험">
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

        {/* ── 모집글 (있을 때만) ── */}
        {detail.recruitPosts && detail.recruitPosts.length > 0 && (
          <>
            <SectionTitle title="모집글" />
            {detail.recruitPosts.map((post) => (
              <RecruitPostCard key={post.postId} post={post} />
            ))}
          </>
        )}

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
        <View style={s.card}>
          <Text style={s.tempCardLabel}>티밋 온도</Text>
          <View style={s.tempScoreRow}>
            <Text style={s.tempScore}>{detail.temperature}</Text>
            <Text style={s.tempScoreMax}> / 40</Text>
          </View>
          <TempBar value={detail.temperature} />

          <View style={s.statDivider} />
          <StatRow label="총평"       value={detail.reviewStats.totalRating} />
          <StatRow label="응답 속도"  value={detail.reviewStats.responseSpeed} />
          <StatRow label="마감 완수"  value={detail.reviewStats.deadlineCompletion} />
          <StatRow label="참여 강도"  value={detail.reviewStats.participationIntensity} />

          {detail.reviewKeywords.length > 0 && (
            <>
              <View style={s.reviewInnerDivider} />
              <View style={s.keywordRow}>
                {detail.reviewKeywords.slice(0, KEYWORD_SHOW).map((kw) => (
                  <View key={kw.text} style={s.keywordPill}>
                    <Text style={s.keywordText}>{kw.text}</Text>
                    <View style={s.kwCountBadge}>
                      <Text style={s.kwCountText}>{kw.count}</Text>
                    </View>
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

          {detail.teamReviews.length > 0 && (
            <>
              <View style={s.reviewInnerDivider} />
              <View style={s.reviewHeader}>
                <Text style={s.reviewHeaderTitle}>💬 팀원 리뷰</Text>
                <Text style={s.reviewCount}>{detail.teamReviews.length}개</Text>
              </View>
              {detail.teamReviews.map((r, i) => (
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
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 16,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
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
  rightActions: { alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  heartBtn: { padding: 2 },
  heartIcon: { fontSize: 22, color: Colors.grayMedium },
  heartIconFilled: { color: Colors.primary },
  chatPill: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chatPillText: { fontSize: 12, fontWeight: '700', color: Colors.white },

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

  /* 모집글 카드 */
  recruitCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 16,
    marginBottom: 8,
    gap: 8,
  },
  recruitTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recruitViews: { fontSize: 12, color: Colors.grayMedium },
  recruitDate: { fontSize: 12, color: Colors.grayMedium },
  recruitTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  recruitMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  recruitMeta: { fontSize: 12, color: Colors.grayMedium },
  recruitMetaDot: { fontSize: 12, color: Colors.grayMedium },
  recruitBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  recruitTeamCount: { fontSize: 13, color: Colors.dark, fontWeight: '500' },
  recruitIcons: { flexDirection: 'row', gap: 10 },
  recruitIconText: { fontSize: 12, color: Colors.grayMedium },

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

  /* 리뷰 카드 */
  tempCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 4,
  },
  tempScoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  tempScore: { fontSize: 52, fontWeight: '700', color: Colors.primary, lineHeight: 56 },
  tempScoreMax: { fontSize: 18, color: Colors.grayMedium, marginBottom: 6 },
  barWrap: { marginHorizontal: 16, marginBottom: 8 },
  barTrack: {
    height: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  barScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  barScaleText: { fontSize: 11, color: Colors.grayLight },
  statDivider: { height: 1, backgroundColor: '#F0F0F0', marginTop: 4 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  statLabel: { fontSize: 13, color: Colors.grayMedium, width: 72 },
  statValue: { fontSize: 13, color: Colors.dark, flex: 1, textAlign: 'right' },
  reviewInnerDivider: { height: 1, backgroundColor: '#F0F0F0' },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  keywordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.white,
  },
  keywordText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  kwCountBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kwCountText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  reviewHeaderTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  reviewCount: { fontSize: 13, color: Colors.grayMedium },
  reviewItem: { paddingHorizontal: 16, paddingVertical: 14 },
  reviewItemBorder: { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  reviewContent: { fontSize: 14, color: Colors.dark, lineHeight: 22, marginBottom: 5 },
  reviewReviewer: { fontSize: 12, color: Colors.grayMedium },
});
