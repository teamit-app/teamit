import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useSegments } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { EDUCATION_STATUS_LABEL } from '../../../../src/constants/education';
import { getOrCreateDirectChatRoom } from '../../../../src/services/messageService';
import { getUserDetail } from '../../../../src/services/talentService';
import { useAuthStore } from '../../../../src/store/useAuthStore';
import { useExploreStore } from '../../../../src/store/useExploreStore';
import { TalentDetail, TalentRecruitPost } from '../../../../src/types/talent';
import { ReviewStatsCard } from '../../../../src/components/profile/ReviewStatsCard';
import { requireAuthForChat } from '../../../../src/utils/authGuard';
import { Alert } from '../../../../src/utils/alert';
import { resolveImageUrl } from '../../../../src/utils/imageUrl';
import { useScrollDepthTracking } from '../../../../src/hooks/useScrollDepthTracking';
import { trackEvent } from '../../../../src/services/gtm';

const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';

const GENDER_LABEL: Record<string, string> = { MALE: '남성', FEMALE: '여성' };

// ── 소섹션 타이틀 ──────────────────────────────────────────────────────────────
function SectionTitle({ title }: { title: string }) {
  return (
    <View style={s.sectionTitleWrap}>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
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

// ── 모집글 카드 ───────────────────────────────────────────────────────────────
function RecruitPostCard({ post }: { post: TalentRecruitPost }) {
  // profile/messages 탭에 alias된 화면에서도 쓰이므로 explore를 하드코딩하지 않는다
  const segments = useSegments();
  const sourceTab = (segments[1] as string) ?? 'explore';

  return (
    <TouchableOpacity
      style={s.recruitCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push(`/${sourceTab}/post/${post.postId}?contestId=${post.contestId}` as never)
      }
    >
      <View style={s.recruitTopRow}>
        <Text style={s.recruitViews}>조회 {post.views}</Text>
        <Text style={s.recruitDate}>{post.createdAt.replace(/-/g, '.')}</Text>
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
        {[post.experienceCondition, [post.meetingType, post.location].filter(Boolean).join(' '), post.intensity]
          .filter(Boolean)
          .map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Text style={s.recruitMetaDot}> · </Text>}
              <Text style={s.recruitMeta}>{part}</Text>
            </React.Fragment>
          ))}
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
  const [detail, setDetail] = useState<TalentDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const toggleTalentHeartInStore = useExploreStore((s) => s.toggleTalentHeart);
  const isMe = detail?.userId === currentUserId;
  const segments = useSegments();
  const sourceTab = (segments[1] as string) ?? 'explore';
  const scrollTracking = useScrollDepthTracking('profile_detail', userId);

  useEffect(() => {
    setLoadError(false);
    if (IS_MOCK) {
      // mock 모드: 로컬 더미 데이터 사용
      import('../../../../src/data/talents').then(({ dummyTalentDetails }) => {
        const found = dummyTalentDetails.find((d) => d.userId === Number(userId))
          ?? dummyTalentDetails[0];
        setDetail(found);
        setHearted(found.isHearted);
      });
    } else {
      // 서버 모드: API 호출. 실패 시 이전엔 console.error만 하고 넘어가서 화면이 로딩
      // 스피너에 계속 멈춰있는 것처럼 보였다 — 에러 상태를 보여주고 재시도할 수 있게 한다.
      getUserDetail(Number(userId))
        .then((d) => {
          setDetail(d);
          setHearted(d.isHearted);
        })
        .catch((e) => {
          console.error('[TalentDetail] 프로필 조회 실패:', e);
          setLoadError(true);
        });
    }
  }, [userId, reloadKey]);

  // useExploreStore를 통해 토글해야 탐색 > 인재풀 목록의 하트 상태도 함께 갱신된다
  // (그 store가 인재 좋아요의 단일 진실 공급원 역할을 함)
  const handleToggleHeart = async () => {
    if (!detail) return;
    const prev = hearted;
    setHearted(!prev);
    try {
      await toggleTalentHeartInStore(detail.userId, prev);
    } catch (e) {
      console.error('[TalentDetail] 하트 처리 실패:', e);
      setHearted(prev);
    }
  };

  const handleChat = async () => {
    if (!detail) return;
    if (!requireAuthForChat(`/${sourceTab}/talent/${detail.userId}`)) return;
    try {
      const chatRoomId = await getOrCreateDirectChatRoom(detail.userId);
      trackEvent('chat_start', { target_user_id: detail.userId });
      // messages 탭은 채팅방이 자기 자신의 [chatId] 화면이라 /chat 접두사가 없다
      const chatPath = sourceTab === 'messages' ? `/messages/${chatRoomId}` : `/${sourceTab}/chat/${chatRoomId}`;
      router.push(chatPath as never);
    } catch (e) {
      // 이전엔 실패 시 아무 반응도 없이 조용히 무시해서, 버튼을 눌러도 채팅창으로
      // 안 들어가지는 것처럼 보이는 버그였다 — 실패를 사용자에게 알리고 다시 시도하게 한다.
      console.error('[TalentDetail] 채팅방 생성 실패:', e);
      Alert.alert('채팅을 시작하지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  if (loadError) {
    return (
      <View style={[s.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <Text style={{ fontSize: 14, color: Colors.grayMedium }}>프로필을 불러오지 못했어요.</Text>
        <TouchableOpacity
          style={s.chatPill}
          onPress={() => setReloadKey((k) => k + 1)}
          activeOpacity={0.85}
        >
          <Text style={s.chatPillText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[s.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        {...scrollTracking}
      >

        {/* ── 프로필 카드 ── */}
        <View style={s.profileCard}>
          <View style={s.profileTop}>
            <View style={s.avatar}>
              {resolveImageUrl(detail.profileImageUrl) ? (
                <Image source={{ uri: resolveImageUrl(detail.profileImageUrl)! }} style={s.avatarImage} />
              ) : (
                <Text style={s.avatarEmoji}>🧑‍💻</Text>
              )}
            </View>

            <View style={s.profileInfo}>
              <View style={s.nameRow}>
                <Text style={s.name}>{detail.nickname}</Text>
                <Text style={s.gender}>{GENDER_LABEL[detail.gender]}</Text>
                <View style={s.tempPill}>
                  <Text style={s.tempPillText}>★ {detail.averageRating.toFixed(1)}</Text>
                </View>
                {isMe && (
                  <View style={s.meBadge}>
                    <Text style={s.meBadgeText}>나</Text>
                  </View>
                )}
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

            {/* 우측: 하트 + 채팅하기 pill */}
            <View style={s.rightActions}>
              <TouchableOpacity
                onPress={handleToggleHeart}
                hitSlop={8}
                style={s.heartBtn}
              >
                <Text style={[s.heartIcon, hearted && s.heartIconFilled]}>
                  {hearted ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
              {!isMe && (
                <TouchableOpacity style={s.chatPill} onPress={handleChat} activeOpacity={0.85}>
                  <Text style={s.chatPillText}>채팅하기</Text>
                </TouchableOpacity>
              )}
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
              pathname: `/${sourceTab}/all-reviews` as never,
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
    overflow: 'hidden',
  },
  avatarImage: { width: 60, height: 60 },
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
  meBadge: {
    backgroundColor: Colors.dark,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  meBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },
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
  sectionTitleWrap: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
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
});
