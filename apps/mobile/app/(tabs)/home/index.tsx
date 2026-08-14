import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../../src/constants/colors';
import { ContestCard } from '../../../src/components/explore/ContestCard';
import { FilterPills } from '../../../src/components/explore/FilterPills';
import { RecruitPostCard } from '../../../src/components/explore/RecruitPostCard';
import { getPopularContests } from '../../../src/services/contestService';
import { getMatchingStatus } from '../../../src/services/matchingService';
import { getPosts, adaptToRecruitPost } from '../../../src/services/postService';
import { getNotifications } from '../../../src/services/notificationService';
import { useNotificationStore } from '../../../src/store/useNotificationStore';
import { REALTIME_STALE_TIME } from '../../../src/services/realtimeEvents';
import { ContestStatus } from '../../../src/types/contest';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { withAuth, requireAuthForNotifications } from '../../../src/utils/authGuard';
import { trackEvent } from '../../../src/services/gtm';

type StatusFilter = 'ALL' | ContestStatus;

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'ONGOING', label: '진행중' },
  { key: 'DEADLINE_SOON', label: '마감임박' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const currentUserId = useAuthStore((s) => s.currentUserId);

  const { data: contests = [] } = useQuery({
    queryKey: ['popularContests'],
    queryFn: getPopularContests,
  });

  const { data: recentPosts = [] } = useQuery({
    queryKey: ['homeRecentPosts'],
    queryFn: () => getPosts({ sort: 'LATEST', size: 5 }),
  });

  // 지원/초대/수락거절/팀확정 알림이 오면 realtimeEvents.ts가 즉시 무효화해주므로,
  // staleTime은 "이벤트를 놓쳤을 때"를 위한 보수적인 상한선일 뿐이다.
  const { data: matchingStatus = null } = useQuery({
    queryKey: ['matchingStatus', currentUserId],
    queryFn: getMatchingStatus,
    enabled: !!currentUserId,
    staleTime: REALTIME_STALE_TIME,
  });

  // 웹소켓으로 실시간 반영되는 unreadCount의 최초 값 — 소켓 연결 전/중 놓친 알림까지 포함해서 시드한다
  const { data: notificationsSeed } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!currentUserId,
    staleTime: REALTIME_STALE_TIME,
  });

  useEffect(() => {
    if (notificationsSeed) setUnreadCount(notificationsSeed.unreadCount);
  }, [notificationsSeed, setUnreadCount]);

  const filteredContests = contests.filter(
    (contest) => statusFilter === 'ALL' || contest.status === statusFilter,
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>티밋</Text>
        <TouchableOpacity
          onPress={() => { if (requireAuthForNotifications()) router.push('/home/notifications'); }}
          hitSlop={8}
          style={styles.bellWrap}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadCount > 0 && <View style={styles.bellBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 배너 */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>나에게 딱 맞는 팀,{'\n'}티밋에서 찾아보세요!</Text>
          <Text style={styles.bannerSubtitle}>내 협업 스타일을 입력하고 맞는 팀원을 찾아보세요</Text>
        </View>

        {/* 나의 실시간 매칭 현황 */}
        {currentUserId ? (
          <View style={styles.matchingBox}>
            <View style={styles.matchingTitleRow}>
              <View style={styles.dot} />
              <Text style={styles.matchingTitle}>나의 실시간 매칭 현황</Text>
            </View>

            <View style={styles.matchingColumns}>
              <TouchableOpacity
                style={styles.matchingColLeft}
                activeOpacity={0.75}
                onPress={() => router.push('/(tabs)/profile/received-applications')}
              >
                <Text style={styles.matchingLabel}>내 모집글에 지원한 사람</Text>
                <View style={styles.matchingValueRow}>
                  <Text style={styles.matchingValue}>{matchingStatus?.myPostApplicantCount ?? '-'}</Text>
                  <Text style={styles.matchingLinkPrimary}>보기 ›</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.matchingColRight}
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/messages',
                    params: { initialTab: 'invitations' },
                  })
                }
              >
                <Text style={styles.matchingLabel}>나에게 온 팀 초대</Text>
                <View style={styles.matchingValueRow}>
                  <Text style={styles.matchingValue}>{matchingStatus?.receivedInvitationCount ?? '-'}</Text>
                  <Text style={styles.matchingLinkGray}>기록 ›</Text>
                </View>
              </TouchableOpacity>
            </View>

            {matchingStatus?.recentActivity && (
              <View style={styles.activityBubble}>
                <View style={styles.activityLeft}>
                  <Text style={styles.activityIcon}>💬</Text>
                  <Text style={styles.activityText} numberOfLines={2}>
                    {matchingStatus.recentActivity.message}
                  </Text>
                </View>
                <Text style={styles.activityTime} numberOfLines={1}>
                  {matchingStatus.recentActivity.relativeTime}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.guestCtaButton}
            activeOpacity={0.85}
            onPress={() => withAuth('/(tabs)/home')}
          >
            <Text style={styles.guestCtaText}>간편 로그인하고 팀 매칭하기</Text>
          </TouchableOpacity>
        )}

        {/* 금주의 인기 공모전 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>금주의 인기 공모전</Text>
          <Text style={styles.sectionSubtitle}>이번 주 가장 주목받는 공모전이에요</Text>

          <View style={styles.filterRow}>
            <FilterPills
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(status) => {
                trackEvent('tab_select', {
                  tab_group: 'home_popular_contests',
                  tab_name: status.toLowerCase(),
                  from_tab: statusFilter.toLowerCase(),
                });
                setStatusFilter(status);
              }}
            />
          </View>

          <View style={styles.list}>
            {filteredContests.slice(0, 5).map((contest) => (
              <ContestCard
                key={contest.contestId}
                contest={contest}
                variant="compact"
                onPress={() => router.push(`/home/contest/${contest.contestId}` as never)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() =>
              router.push({ pathname: '/(tabs)/explore', params: { tab: 'CONTEST', sort: 'POPULAR' } })
            }
          >
            <Text style={styles.moreBtnText}>더보기 ›</Text>
          </TouchableOpacity>
        </View>

        {/* 모집글 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>모집글</Text>
          <Text style={styles.sectionSubtitle}>지금 팀원을 찾고 있는 모집글이에요</Text>

          <View style={styles.list}>
            {recentPosts.map((post) => (
              <RecruitPostCard
                key={post.postId}
                post={adaptToRecruitPost(post)}
                showContestBadge
                onPress={() => router.push(`/explore/post/${post.postId}` as never)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => router.push({ pathname: '/(tabs)/explore', params: { tab: 'POST' } })}
          >
            <Text style={styles.moreBtnText}>더보기 ›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  bellWrap: {
    position: 'relative',
  },
  bellIcon: {
    fontSize: 22,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.error,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  banner: {
    backgroundColor: Colors.ogTint,
    borderRadius: 16,
    padding: 20,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 25,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 8,
  },
  matchingBox: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  matchingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  matchingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  matchingColumns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  matchingColLeft: {
    flex: 1,
    backgroundColor: Colors.ogTint,
    borderRadius: 12,
    padding: 14,
  },
  matchingColRight: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
  },
  matchingLabel: {
    fontSize: 13,
    color: Colors.gray,
  },
  matchingValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  matchingValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
  },
  guestCtaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  guestCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  matchingLinkPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  matchingLinkGray: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.grayMedium,
  },
  activityBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.ogTint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 8,
  },
  activityIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  activityText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.dark,
    flexShrink: 1,
    lineHeight: 17,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginLeft: 8,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.grayMedium,
    marginTop: 4,
  },
  filterRow: {
    marginTop: 14,
  },
  list: {
    marginTop: 16,
  },
  moreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  moreBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grayMedium,
  },
});
