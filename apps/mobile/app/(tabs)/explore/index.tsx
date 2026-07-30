import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { SegmentedTabs } from '../../../src/components/explore/SegmentedTabs';
import { SearchBar } from '../../../src/components/explore/SearchBar';
import { FilterPills } from '../../../src/components/explore/FilterPills';
import { ContestCard } from '../../../src/components/explore/ContestCard';
import { TalentCard } from '../../../src/components/explore/TalentCard';
import { CategoryFilterModal, CategoryFilter } from '../../../src/components/explore/CategoryFilterModal';
import { useExploreContests, useExploreTalents, toggleTalentHeart, toggleContestHeart, refetchExploreData } from '../../../src/hooks/useExploreData';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { getOrCreateDirectChatRoom } from '../../../src/services/messageService';
import { requireAuthForChat, requireAuthForHeart } from '../../../src/utils/authGuard';
import { trackEvent } from '../../../src/services/gtm';
import { Alert } from '../../../src/utils/alert';

type MainTab = 'POOL' | 'CONTEST';
type SortFilter = 'ALL' | 'LATEST' | 'POPULAR';

const SORT_OPTIONS: { key: SortFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'LATEST', label: '최신순' },
  { key: 'POPULAR', label: '인기순' },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [mainTab, setMainTab] = useState<MainTab>('POOL');
  const [keyword, setKeyword] = useState('');
  const [sortFilter, setSortFilter] = useState<SortFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const { data: talents = [], isLoading: talentsLoading, isFetching: talentsFetching } = useExploreTalents();
  const { data: contests = [], isLoading: contestsLoading, isFetching: contestsFetching } = useExploreContests();
  const isLoading = talentsLoading || contestsLoading;
  const isRefreshing = talentsFetching || contestsFetching;
  const currentUserId = useAuthStore((s) => s.currentUserId);

  // 세션 내내 캐시되는 목록이라 다른 탭에 갔다가 돌아와도 자동으로는 안 바뀐다 — 탐색 탭
  // 재진입/재탭(_layout.tsx)/당겨서 새로고침(아래 RefreshControl) 세 가지 트리거를 모두
  // refetchExploreData()로 통일한다. 최초 마운트는 useQuery가 이미 처리하므로 건너뛴다.
  const hasFocusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnce.current) {
        refetchExploreData();
      }
      hasFocusedOnce.current = true;
    }, []),
  );

  const handlePropose = async (targetUserId: number) => {
    if (!requireAuthForChat(`/explore/talent/${targetUserId}`)) return;
    try {
      const chatRoomId = await getOrCreateDirectChatRoom(targetUserId);
      router.push(`/explore/chat/${chatRoomId}` as never);
    } catch (e) {
      // 이전엔 로그만 남기고 사용자에게는 아무 반응도 없어서, 버튼을 눌러도 채팅창으로
      // 안 들어가지는 것처럼 보이는 버그였다 — 실패를 사용자에게 알리고 다시 시도하게 한다.
      console.error('[Explore] 채팅방 생성 실패:', e);
      Alert.alert('채팅을 시작하지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  const filteredTalents = talents.filter((talent) =>
    keyword.trim().length === 0
      ? true
      : talent.nickname.includes(keyword) ||
        talent.skills.some((skill) => skill.skillName.toLowerCase().includes(keyword.toLowerCase())),
  );

  const filteredContests = contests.filter((contest) => {
    const matchesKeyword =
      keyword.trim().length === 0 ||
      contest.title.includes(keyword) ||
      contest.organizer.includes(keyword) ||
      contest.categoryLabel.includes(keyword);
    const matchesCategory = categoryFilter === 'ALL' || contest.category === categoryFilter;
    return matchesKeyword && matchesCategory;
  });

  const sortedContests = [...filteredContests].sort((a, b) => {
    if (sortFilter === 'POPULAR') return b.dDay - a.dDay;
    return 0;
  });

  if (isLoading && talents.length === 0 && contests.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="탐색"
          rightElement={<Text style={styles.heartIcon}>♡</Text>}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="탐색"
        rightElement={
          <TouchableOpacity
            onPress={() => { if (requireAuthForHeart()) router.push('/(tabs)/profile/likes'); }}
            hitSlop={8}
          >
            <Text style={styles.heartIcon}>♡</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.tabSwitchWrap}>
        <SegmentedTabs
          options={[
            { key: 'POOL', label: '인재풀' },
            { key: 'CONTEST', label: '공모전' },
          ]}
          value={mainTab}
          onChange={(tab) => {
            trackEvent('tab_select', {
              tab_group: 'explore_menu',
              tab_name: tab.toLowerCase(),
              from_tab: mainTab.toLowerCase(),
            });
            setMainTab(tab);
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetchExploreData}
            tintColor={Colors.primary}
          />
        }
      >
        <SearchBar
          placeholder={mainTab === 'POOL' ? '이름, 역할, 스킬로 검색' : '공모전 이름, 주최기관, 분야 검색'}
          value={keyword}
          onChangeText={setKeyword}
        />

        {mainTab === 'CONTEST' && (
          <View style={styles.filterRow}>
            <FilterPills
              options={SORT_OPTIONS}
              value={sortFilter}
              onChange={setSortFilter}
              trailingLabel="분야별"
              onPressTrailing={() => setCategoryModalVisible(true)}
            />
          </View>
        )}

        <View style={styles.list}>
          {mainTab === 'POOL'
            ? filteredTalents.map((talent) => (
                <TalentCard
                  key={talent.userId}
                  talent={talent}
                  isMe={talent.userId === currentUserId}
                  onPress={() => router.push(`/explore/talent/${talent.userId}` as never)}
                  onPressHeart={() => toggleTalentHeart(talent.userId, talent.isHearted)}
                  onPressPropose={() => handlePropose(talent.userId)}
                />
              ))
            : sortedContests.map((contest) => (
                <ContestCard
                  key={contest.contestId}
                  contest={contest}
                  variant="full"
                  onPress={() => router.push(`/explore/contest/${contest.contestId}` as never)}
                  onPressHeart={() => toggleContestHeart(contest.contestId)}
                />
              ))}
        </View>

        <Text style={styles.footerHint}>
          우측 상단 하트에서 좋아요 목록을 확인할 수 있어요
        </Text>
      </ScrollView>

      <CategoryFilterModal
        visible={categoryModalVisible}
        selectedCategory={categoryFilter}
        onApply={(cat) => {
          setCategoryFilter(cat);
          setCategoryModalVisible(false);
        }}
        onClose={() => setCategoryModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  heartIcon: {
    fontSize: 22,
    color: Colors.dark,
  },
  tabSwitchWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  filterRow: {
    marginTop: 14,
  },
  list: {
    marginTop: 16,
  },
  footerHint: {
    fontSize: 12,
    color: Colors.grayLight,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
