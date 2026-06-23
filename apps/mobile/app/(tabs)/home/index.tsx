import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ContestCard } from '../../../src/components/explore/ContestCard';
import { FilterPills } from '../../../src/components/explore/FilterPills';
import { getPopularContests } from '../../../src/services/contestService';
import { getMatchingStatus } from '../../../src/services/matchingService';
import { Contest, ContestStatus } from '../../../src/types/contest';
import { MatchingStatus } from '../../../src/types/matching';

type StatusFilter = 'ALL' | ContestStatus;

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'ONGOING', label: '진행중' },
  { key: 'DEADLINE_SOON', label: '마감임박' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [contests, setContests] = useState<Contest[]>([]);
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  useEffect(() => {
    getPopularContests()
      .then(setContests)
      .catch((e) => console.error('[Home] 인기 공모전 로드 실패:', e));
    getMatchingStatus()
      .then((data) => { if (data) setMatchingStatus(data); })
      .catch((e) => console.error('[Home] 매칭 현황 로드 실패:', e));
  }, []);

  const filteredContests = contests.filter(
    (contest) => statusFilter === 'ALL' || contest.status === statusFilter,
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>티밋</Text>
        <TouchableOpacity onPress={() => router.push('/home/notifications')} hitSlop={8}>
          <Text style={styles.bellIcon}>🔔</Text>
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
        <View style={styles.matchingBox}>
          <View style={styles.matchingTitleRow}>
            <View style={styles.dot} />
            <Text style={styles.matchingTitle}>나의 실시간 매칭 현황</Text>
          </View>

          <View style={styles.matchingColumns}>
            <View style={styles.matchingColLeft}>
              <Text style={styles.matchingLabel}>나에게 온 제안</Text>
              <View style={styles.matchingValueRow}>
                <Text style={styles.matchingValue}>{matchingStatus?.receivedProposalCount ?? '-'}</Text>
                <Text style={styles.matchingLinkPrimary}>보기 ›</Text>
              </View>
            </View>
            <View style={styles.matchingColRight}>
              <Text style={styles.matchingLabel}>내가 지원한 팀</Text>
              <View style={styles.matchingValueRow}>
                <Text style={styles.matchingValue}>{matchingStatus?.appliedTeamCount ?? '-'}</Text>
                <Text style={styles.matchingLinkGray}>기록 ›</Text>
              </View>
            </View>
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

        {/* 금주의 인기 공모전 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>금주의 인기 공모전</Text>
          <Text style={styles.sectionSubtitle}>이번 주 가장 주목받는 공모전이에요</Text>

          <View style={styles.filterRow}>
            <FilterPills options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          </View>

          <View style={styles.list}>
            {filteredContests.map((contest) => (
              <ContestCard
                key={contest.contestId}
                contest={contest}
                variant="compact"
                onPress={() => router.push(`/explore/contest/${contest.contestId}` as never)}
              />
            ))}
          </View>
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
  bellIcon: {
    fontSize: 22,
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
});
