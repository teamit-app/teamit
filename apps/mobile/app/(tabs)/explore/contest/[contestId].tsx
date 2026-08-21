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
import { RecruitPostCard } from '../../../../src/components/explore/RecruitPostCard';
import { useExploreContests, toggleContestHeart } from '../../../../src/hooks/useExploreData';
import { useAuthStore } from '../../../../src/store/useAuthStore';
import { getContestDetail, checkIsParticipant } from '../../../../src/services/contestService';
import { getPostsByContest, adaptToRecruitPost } from '../../../../src/services/postService';
import { SortOption, RecruitPost, ContestDetail } from '../../../../src/types/contest';
import { formatDDay } from '../../../../src/utils/dday';
import { withAuth } from '../../../../src/utils/authGuard';
import { resolveImageUrl } from '../../../../src/utils/imageUrl';
import { trackEvent } from '../../../../src/services/gtm';

const SORT_LABEL: Record<SortOption, string> = {
  LATEST: '최신순',
  POPULAR: '인기순',
  DEADLINE: '마감임박순',
};

export default function ContestDetailScreen() {
  const insets = useSafeAreaInsets();
  const { contestId, source } = useLocalSearchParams<{ contestId: string; source?: string }>();
  const segments = useSegments();
  const sourceTab = (segments[1] as string) ?? 'explore';
  // 어느 화면에서 진입했는지는 링크를 건 쪽에서 명시적으로 넘겨주는 source 쿼리 파라미터가
  // 기준이다 — 이 화면 자체는 explore/home/profile/messages 탭에 모두 alias되어 있어서
  // sourceTab(현재 탭)만으로는 "모집글에서 눌렀는지" 같은 세부 출처를 구분할 수 없다.
  const contestViewSource = source ?? sourceTab;
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('LATEST');
  const [detail, setDetail] = useState<ContestDetail | null>(null);
  const [apiPosts, setApiPosts] = useState<RecruitPost[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  // 포스터 실제 가로세로 비율을 구해서 컨테이너에 꽉 차게(레터박스 없이) 보여준다
  const [posterAspectRatio, setPosterAspectRatio] = useState<number | null>(null);

  const { data: contests = [] } = useExploreContests();
  const currentUserId = useAuthStore((s) => s.currentUserId);

  const id = Number(contestId);
  const storeContest = contests.find((c) => c.contestId === id);
  const isHearted = storeContest?.isHearted ?? detail?.isHearted ?? false;

  const handleBuildTeamPress = () => {
    trackEvent('build_team_start', { contest_id: id, source: 'contest_detail' });
    withAuth(`/explore/build-team/${id}`);
  };

  const handleParticipatePress = () => {
    trackEvent('participate_start', { contest_id: id });
    withAuth(`/explore/participate?contestId=${id}`);
  };

  useEffect(() => {
    getContestDetail(id).then(setDetail).catch(() => {});
    getPostsByContest(id)
      .then((posts) => setApiPosts(posts.map(adaptToRecruitPost)))
      .catch(() => {});
    checkIsParticipant(id)
      .then(setIsParticipant)
      .catch(() => {});
  }, [id]);

  // detail.contestId !== id인 동안(다른 공모전에서 넘어오는 과도기)은 아직 이전 공모전의
  // detail이 남아있는 상태라, 이 조건으로 걸러야 잘못된 category/fields로 잘못 집계되지 않는다.
  useEffect(() => {
    if (!detail || detail.contestId !== id) return;
    trackEvent('contest_view', {
      source: contestViewSource,
      contest_id: id,
      category: detail.category.toLowerCase(),
      recruit_fields: detail.fields,
    });
  }, [detail, id, contestViewSource]);

  // 이미지가 바뀌면(다른 공모전으로 이동 등) 이전 비율이 잠깐 남아있지 않도록 초기화
  useEffect(() => {
    setPosterAspectRatio(null);
  }, [detail?.imageUrl]);

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
        {resolveImageUrl(detail?.imageUrl) ? (
          <Image
            source={{ uri: resolveImageUrl(detail?.imageUrl)! }}
            style={
              posterAspectRatio
                ? { width: '100%' as const, aspectRatio: posterAspectRatio }
                : styles.imagePlaceholder
            }
            resizeMode="contain"
            onLoad={(e) => {
              const { width, height } = e.nativeEvent.source;
              if (width && height) setPosterAspectRatio(width / height);
            }}
          />
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
              <TouchableOpacity
                style={styles.loginNoticeBtn}
                activeOpacity={0.8}
                onPress={() => withAuth(`/explore/contest/${id}`)}
              >
                <Text style={styles.loginNoticeBtnText}>로그인하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 팀 직접 꾸리기 */}
          <TouchableOpacity
            style={[
              styles.participateCard,
              (!!myPost || !currentUserId) && styles.participateCardDone,
            ]}
            activeOpacity={myPost || !currentUserId ? 1 : 0.85}
            disabled={!currentUserId}
            onPress={myPost || !currentUserId ? undefined : handleBuildTeamPress}
          >
            <View style={[styles.participateAccentBar, (!!myPost || !currentUserId) && styles.participateAccentBarDone]} />
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
                    ? '이 공모전에는 이미 모집글을 작성했어요.\n모집글은 공모전당 하나만 작성할 수 있어요.'
                    : '내가 모집자가 되어 팀원을 직접 찾아요.\n원하는 팀 구성을 주도하고 싶다면 추천해요.'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 팀 매칭 제안 받기 */}
          <TouchableOpacity
            style={[
              styles.participateCard,
              (participated || !currentUserId) && styles.participateCardDone,
            ]}
            activeOpacity={participated || !currentUserId ? 1 : 0.85}
            disabled={!currentUserId}
            onPress={
              participated || !currentUserId
                ? undefined
                : handleParticipatePress
            }
          >
            <View style={[styles.participateAccentBar, (participated || !currentUserId) && styles.participateAccentBarDone]} />
            <View style={styles.participateCardContent}>
              <Text style={styles.participateEmoji}>{participated ? '✅' : '💌'}</Text>
              <View style={styles.participateTextWrap}>
                <View style={styles.participateTitleRow}>
                  <Text style={[styles.participateTitle, participated && styles.participateTitleDone]}>
                    {participated ? '매칭 후보 등록 완료' : '팀 매칭 제안 받기 (후보 등록)'}
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
              style={myPostStyles.myPostCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/${sourceTab}/post/${myPost.postId}?contestId=${id}` as never)}
            >
              <View style={myPostStyles.myPostBadgeRow}>
                <View style={myPostStyles.myPostBadge}>
                  <Text style={myPostStyles.myPostBadgeText}>내가 올린 모집글</Text>
                </View>
              </View>
              <Text style={myPostStyles.title}>{myPost.title}</Text>
              <Text style={myPostStyles.memberCount}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.ogTint,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 8,
  },
  loginNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  loginNoticeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  loginNoticeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
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

const myPostStyles = StyleSheet.create({
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
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 10,
  },
  memberCount: { fontSize: 12, color: Colors.gray, fontWeight: '500' },
});
