import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useSegments } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { ScreenHeader } from '../../../../src/components/common/ScreenHeader';
import { SortBottomSheet } from '../../../../src/components/explore/SortBottomSheet';
import { useExploreStore } from '../../../../src/store/useExploreStore';
import { useAuthStore } from '../../../../src/store/useAuthStore';
import { getContestDetail, checkIsParticipant } from '../../../../src/services/contestService';
import { getPostsByContest, PostListItem } from '../../../../src/services/postService';
import { SortOption, RecruitPost, ContestDetail } from '../../../../src/types/contest';
import { formatDDay } from '../../../../src/utils/dday';
import { withAuth } from '../../../../src/utils/authGuard';

const SORT_LABEL: Record<SortOption, string> = {
  LATEST: '최신순',
  POPULAR: '인기순',
  DEADLINE: '마감임박순',
};

const normalizeMeetingType = (type: string) => {
  if (type === 'MIXED' || type.includes('혼합')) return '온오프라인혼합';
  if (type === 'OFFLINE' || type.includes('오프라인')) return '오프라인';
  return '온라인';
};

const isOfflineOrMixed = (type: string) =>
  type === 'OFFLINE' || type === 'MIXED' || type.includes('오프라인') || type.includes('혼합');

const genderLabel = (recruiterGender?: string, genderCondition?: string) => {
  const genderText = recruiterGender === 'MALE' ? '남성' : recruiterGender === 'FEMALE' ? '여성' : '';
  const conditionText = genderCondition === 'SAME' ? '동성만' : '성별 무관';
  return [genderText, conditionText].filter(Boolean).join(' · ');
};

function RecruitPostCard({ post, onPress }: { post: RecruitPost; onPress: () => void }) {
  const meetingStr = `${normalizeMeetingType(post.meetingType)}${
    post.location && isOfflineOrMixed(post.meetingType) ? `·${post.location}` : ''
  }`;
  // currentMembers는 모집자 본인을 포함한 실제 팀원 수 — 모집자를 제외한 모집된 인원만 표시
  const recruitedCount = Math.max(post.currentMembers - 1, 0);

  const isClosed = post.status === 'CLOSED';

  return (
    <TouchableOpacity style={postStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={postStyles.topRow}>
        <View style={postStyles.topRowLeft}>
          <Text style={postStyles.views}>조회 {post.views}</Text>
          {isClosed && (
            <View style={postStyles.closedBadge}>
              <Text style={postStyles.closedBadgeText}>마감</Text>
            </View>
          )}
        </View>
        <Text style={postStyles.date}>{post.createdAt}</Text>
      </View>
      <Text style={postStyles.title}>{post.title}</Text>
      <View style={postStyles.skillRow}>
        {post.skills.slice(0, 3).map((skill) => (
          <View key={skill} style={postStyles.skillTag}>
            <Text style={postStyles.skillText}>{skill}</Text>
          </View>
        ))}
        {post.skills.length > 3 && (
          <View style={postStyles.skillTag}>
            <Text style={postStyles.skillText}>+{post.skills.length - 3}</Text>
          </View>
        )}
      </View>
      <View style={postStyles.metaRow}>
        <Text style={postStyles.metaText}>{post.experienceCondition}</Text>
        <Text style={postStyles.metaDot}> · </Text>
        <Text style={postStyles.metaText}>{meetingStr}</Text>
        <Text style={postStyles.metaDot}> · </Text>
        <Text style={postStyles.metaText}>{genderLabel(post.recruiterGender, post.genderCondition)}</Text>
      </View>
      <View style={postStyles.bottomRow}>
        <Text style={postStyles.memberCount}>
          현재 모집된 팀원 {recruitedCount}/{post.totalMembers}명
        </Text>
        <View style={postStyles.statsRow}>
          <Text style={postStyles.stat}>💬 {post.chatCount}</Text>
          <Text style={postStyles.stat}>♥ {post.likeCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// PostListItem → RecruitPost 변환
function adaptToRecruitPost(p: PostListItem): RecruitPost {
  return {
    postId: p.postId,
    contestId: p.contestId ?? 0,
    title: p.title,
    createdAt: p.createdAt ?? '',
    views: p.viewCount ?? 0,
    chatCount: p.commentCount ?? 0,
    likeCount: p.likeCount ?? 0,
    skills: p.skills ?? [],
    experienceCondition: p.experienceCondition ?? '',
    meetingType: p.onlineOffline ?? '',
    location: p.region ?? '',
    // 매칭 프로필 전용 개념이라 모집글에는 해당 데이터가 없음
    intensity: '',
    genderCondition: p.genderCondition,
    recruiterGender: p.recruiterGender,
    currentMembers: p.currentMembers ?? 1,
    totalMembers: p.recruitCount ?? 0,
    isHearted: false,
    ownerUserId: p.ownerUserId,
    status: p.status,
  };
}

export default function ContestDetailScreen() {
  const insets = useSafeAreaInsets();
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const segments = useSegments();
  const sourceTab = (segments[1] as string) ?? 'explore';
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('LATEST');
  const [detail, setDetail] = useState<ContestDetail | null>(null);
  const [apiPosts, setApiPosts] = useState<RecruitPost[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);

  const contests = useExploreStore((s) => s.contests);
  const toggleContestHeart = useExploreStore((s) => s.toggleContestHeart);
  const markContestParticipant = useExploreStore((s) => s.markContestParticipant);
  const currentUserId = useAuthStore((s) => s.currentUserId);

  const id = Number(contestId);
  const storeContest = contests.find((c) => c.contestId === id);
  const isHearted = storeContest?.isHearted ?? detail?.isHearted ?? false;

  useEffect(() => {
    getContestDetail(id).then(setDetail).catch(() => {});
    getPostsByContest(id)
      .then((posts) => setApiPosts(posts.map(adaptToRecruitPost)))
      .catch(() => {});
    checkIsParticipant(id)
      .then(setIsParticipant)
      .catch(() => {});
  }, [id]);

  // 탐색 목록 스토어의 isRegisteredAsParticipant도 참고해 초기값 설정
  const storeParticipant = contests.find((c) => c.contestId === id)?.isRegisteredAsParticipant ?? false;
  const participated = isParticipant || storeParticipant;

  const myPost = apiPosts.find((p) => p.ownerUserId === currentUserId);
  const otherPosts = apiPosts.filter((p) => p.ownerUserId !== currentUserId);

  const sortedPosts = [...otherPosts].sort((a, b) => {
    if (sortOption === 'POPULAR') return b.chatCount + b.likeCount - (a.chatCount + a.likeCount);
    if (sortOption === 'DEADLINE') return a.postId - b.postId;
    return b.postId - a.postId;
  });

  const formattedEndDate = detail?.endDate.replace(/-/g, '.') ?? '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="공모전 세부 정보" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── 상단 공모전 타이틀 카드 ── */}
        <View style={styles.titleCard}>
          <View style={styles.titleCardInner}>
            <View style={styles.titleTextWrap}>
              <Text style={styles.contestTitle}>{detail?.title ?? ''}</Text>
              <Text style={styles.contestMeta}>
                주최: {detail?.organizer ?? ''} · 마감: {formattedEndDate}
              </Text>
            </View>
            <View style={styles.titleRight}>
              <View style={styles.dDayBadge}>
                <Text style={styles.dDayText}>{detail ? formatDDay(detail.dDay) : '-'}</Text>
              </View>
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => toggleContestHeart(id)}
                hitSlop={8}
              >
                <Text style={[styles.heartIcon, isHearted && styles.heartIconFilled]}>
                  {isHearted ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── 공모전 이미지 ── */}
        {detail?.imageUrl ? (
          <Image source={{ uri: detail.imageUrl }} style={styles.imagePlaceholder} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>공모전 이미지</Text>
          </View>
        )}

        {/* ── 공모전 상세 정보 ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>공모전 상세 정보</Text>
          </View>
          <View style={styles.infoTable}>
            {[
              { label: '모집 대상', value: detail?.targetAudience ?? '' },
              { label: '모집 분야', value: detail?.fields ?? '' },
              { label: '시상 규모', value: detail?.prizeScale ?? '' },
              { label: '접수 기간', value: detail?.registrationPeriod ?? '' },
              { label: '접수 URL', value: detail?.registrationUrl ?? '', isLink: true },
            ].map((row, idx, arr) => (
              <View
                key={row.label}
                style={[styles.infoRow, idx === arr.length - 1 && styles.infoRowLast]}
              >
                <Text style={styles.infoLabel}>{row.label}</Text>
                {row.isLink ? (
                  <TouchableOpacity onPress={() => Linking.openURL(row.value)}>
                    <Text style={[styles.infoValue, styles.infoLink]}>{row.value}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoValue}>{row.value}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── 상세내용 ── */}
        {!!detail?.content && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.accentBar} />
              <Text style={styles.sectionTitle}>상세내용</Text>
            </View>
            <Text style={styles.contentText}>{detail.content}</Text>
          </View>
        )}

        {/* ── 어떻게 참여하실 건가요? ── */}
        <View style={styles.participateSectionWrap}>
          <Text style={styles.participateHeading}>어떻게 참여하실 건가요?</Text>
          <Text style={styles.participateSubheading}>원하는 방식을 선택해 주세요</Text>

          {!currentUserId && (
            <View style={styles.loginNoticeBanner}>
              <Text style={styles.loginNoticeText}>🔒 로그인이 필요한 기능이에요</Text>
            </View>
          )}

          {/* 팀 직접 꾸리기 */}
          <TouchableOpacity
            style={[styles.participateCard, !!myPost && styles.participateCardDone]}
            activeOpacity={myPost ? 1 : 0.85}
            onPress={myPost ? undefined : () => withAuth(`/explore/build-team/${id}`)}
          >
            <View style={[styles.participateAccentBar, !!myPost && styles.participateAccentBarDone]} />
            <View style={styles.participateCardContent}>
              <Text style={styles.participateEmoji}>{myPost ? '✅' : '🚀'}</Text>
              <View style={styles.participateTextWrap}>
                <View style={styles.participateTitleRow}>
                  <Text style={[styles.participateTitle, !!myPost && styles.participateTitleDone]}>
                    {myPost ? '모집글 작성 완료' : '팀 직접 꾸리기 (모집글 작성)'}
                  </Text>
                  {!myPost && (
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>약 5분</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.participateDesc, !!myPost && styles.participateDescDone]}>
                  {myPost
                    ? '이 공모전에는 이미 모집글을 작성했어요.\n공모전당 모집글은 하나만 작성할 수 있어요.'
                    : '내가 모집자가 되어 팀원을 직접 찾아요.\n원하는 팀 구성을 주도하고 싶다면 추천해요.'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 팀 매칭 제안 받기 */}
          <TouchableOpacity
            style={[styles.participateCard, participated && styles.participateCardDone]}
            activeOpacity={participated ? 1 : 0.85}
            onPress={participated ? undefined : () => withAuth(`/explore/participate?contestId=${id}`)}
          >
            <View style={[styles.participateAccentBar, participated && styles.participateAccentBarDone]} />
            <View style={styles.participateCardContent}>
              <Text style={styles.participateEmoji}>{participated ? '✅' : '💌'}</Text>
              <View style={styles.participateTextWrap}>
                <View style={styles.participateTitleRow}>
                  <Text style={[styles.participateTitle, participated && styles.participateTitleDone]}>
                    {participated ? '매칭 후보 등록 완료' : '팀 매칭 제안 받기'}
                  </Text>
                  {!participated && (
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>약 3분</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.participateDesc, participated && styles.participateDescDone]}>
                  {participated
                    ? '이 공모전의 팀 매칭 후보로 등록되었어요.\n모집자가 먼저 제안을 보내줄 거예요!'
                    : '내 정보를 등록하면 모집자가 먼저 제안을 보내줘요.\n부담 없이 시작하고 싶다면 추천해요.'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── 팀원 모집글 목록 ── */}
        <View style={styles.recruitSection}>
          <View style={styles.recruitHeader}>
            <Text style={styles.recruitTitle}>팀원 모집글 목록</Text>
            <TouchableOpacity
              style={styles.sortBtn}
              onPress={() => setSortVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.sortBtnText}>{SORT_LABEL[sortOption]} ▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>
              '팀 매칭 제안받기'로 내 정보를 등록한 후 지원할 수 있어요!
            </Text>
          </View>

          {myPost && (
            <TouchableOpacity
              style={postStyles.myPostCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/${sourceTab}/post/${myPost.postId}?contestId=${id}` as never)}
            >
              <View style={postStyles.myPostBadgeRow}>
                <View style={postStyles.myPostBadge}>
                  <Text style={postStyles.myPostBadgeText}>내가 올린 모집글</Text>
                </View>
              </View>
              <Text style={postStyles.title}>{myPost.title}</Text>
              <Text style={postStyles.memberCount}>
                현재 모집된 팀원 {Math.max(myPost.currentMembers - 1, 0)}/{myPost.totalMembers}명
              </Text>
            </TouchableOpacity>
          )}

          {sortedPosts.map((post) => (
            <RecruitPostCard
              key={post.postId}
              post={post}
              onPress={() =>
                router.push(`/${sourceTab}/post/${post.postId}?contestId=${id}` as never)
              }
            />
          ))}

        </View>

      </ScrollView>

      <SortBottomSheet
        visible={sortVisible}
        selectedSort={sortOption}
        onApply={(sort) => {
          setSortOption(sort);
          setSortVisible(false);
        }}
        onClose={() => setSortVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  content: {
    paddingBottom: 40,
  },

  // ── 타이틀 카드 ──
  titleCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleTextWrap: {
    flex: 1,
  },
  contestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    lineHeight: 26,
    marginBottom: 6,
  },
  contestMeta: {
    fontSize: 13,
    color: Colors.grayMedium,
  },
  titleRight: {
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  dDayBadge: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  heartBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 22,
    color: Colors.grayMedium,
  },
  heartIconFilled: {
    color: Colors.primary,
  },

  // ── 공모전 이미지 ──
  imagePlaceholder: {
    height: 200,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: Colors.grayMedium,
  },

  // ── 공모전 상세 정보 ──
  sectionCard: {
    backgroundColor: Colors.white,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  accentBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  infoTable: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'flex-start',
  },
  infoRowLast: {
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  infoLabel: {
    width: 76,
    fontSize: 13,
    color: Colors.grayMedium,
    lineHeight: 20,
    flexShrink: 0,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark,
    lineHeight: 20,
  },
  infoLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  contentText: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 22,
    paddingBottom: 14,
  },

  // ── 참여 방식 ──
  participateSectionWrap: {
    backgroundColor: Colors.white,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  participateHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  participateSubheading: {
    fontSize: 13,
    color: Colors.grayMedium,
    marginBottom: 16,
  },
  loginNoticeBanner: {
    backgroundColor: Colors.ogTint,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  loginNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  participateCard: {
    flexDirection: 'row',
    backgroundColor: Colors.ogTint,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  participateCardDone: {
    backgroundColor: '#F0F0F0',
    opacity: 0.85,
  },
  participateAccentBar: {
    width: 4,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  participateAccentBarDone: {
    backgroundColor: Colors.grayMedium,
  },
  participateCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  participateEmoji: {
    fontSize: 24,
  },
  participateTextWrap: {
    flex: 1,
  },
  participateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  participateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  participateTitleDone: {
    color: Colors.grayMedium,
  },
  timeBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  participateDesc: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 20,
  },
  participateDescDone: {
    color: Colors.grayMedium,
  },

  // ── 모집글 목록 ──
  recruitSection: {
    backgroundColor: Colors.white,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  recruitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recruitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  sortBtn: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  noticeBanner: {
    backgroundColor: Colors.ogTint,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  noticeText: {
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 18,
    fontWeight: '500',
  },
});

const postStyles = StyleSheet.create({
  myPostCard: {
    backgroundColor: Colors.ogTint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 14,
    marginBottom: 14,
  },
  myPostBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  myPostBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  myPostBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  topRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  views: { fontSize: 12, color: Colors.grayMedium },
  date:  { fontSize: 12, color: Colors.grayMedium },
  closedBadge: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  closedBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.grayMedium },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 10,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  skillTag: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  skillText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: { fontSize: 12, color: Colors.grayMedium },
  metaDot:  { fontSize: 12, color: Colors.grayMedium },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: { fontSize: 12, color: Colors.gray, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { fontSize: 12, color: Colors.grayMedium },
});
