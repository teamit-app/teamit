import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { SegmentedTabs } from '../../../src/components/explore/SegmentedTabs';
import { SearchBar } from '../../../src/components/explore/SearchBar';
import { FilterPills } from '../../../src/components/explore/FilterPills';
import { ContestCard } from '../../../src/components/explore/ContestCard';
import { TalentCard } from '../../../src/components/explore/TalentCard';
import { CategoryFilterModal, CategoryFilter } from '../../../src/components/explore/CategoryFilterModal';
import { useExploreStore } from '../../../src/store/useExploreStore';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { getOrCreateDirectChatRoom } from '../../../src/services/messageService';
import { requireAuthForChat } from '../../../src/utils/authGuard';

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

  const talents = useExploreStore((s) => s.talents);
  const contests = useExploreStore((s) => s.contests);
  const isLoading = useExploreStore((s) => s.isLoading);
  const loadData = useExploreStore((s) => s.loadData);
  const toggleTalentHeart = useExploreStore((s) => s.toggleTalentHeart);
  const toggleContestHeart = useExploreStore((s) => s.toggleContestHeart);
  const currentUserId = useAuthStore((s) => s.currentUserId);

  const handlePropose = async (targetUserId: number) => {
    if (!requireAuthForChat(`/explore/talent/${targetUserId}`)) return;
    try {
      const chatRoomId = await getOrCreateDirectChatRoom(targetUserId);
      router.push(`/explore/chat/${chatRoomId}` as never);
    } catch (e) {
      console.error('[Explore] 채팅방 생성 실패:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
            onPress={() => router.push('/(tabs)/profile/likes')}
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
          onChange={setMainTab}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
