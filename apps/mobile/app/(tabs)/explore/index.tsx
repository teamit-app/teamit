import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { SegmentedTabs } from '../../../src/components/explore/SegmentedTabs';
import { SearchBar } from '../../../src/components/explore/SearchBar';
import { FilterPills } from '../../../src/components/explore/FilterPills';
import { ContestCard } from '../../../src/components/explore/ContestCard';
import { TalentCard } from '../../../src/components/explore/TalentCard';
import { RecruitPostCard } from '../../../src/components/explore/RecruitPostCard';
import { CategoryFilterModal, CategoryFilter } from '../../../src/components/explore/CategoryFilterModal';
import { useExploreContests, useExploreTalents, useExplorePosts, toggleTalentHeart, toggleContestHeart, refetchExploreData } from '../../../src/hooks/useExploreData';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { getOrCreateDirectChatRoom } from '../../../src/services/messageService';
import { adaptToRecruitPost } from '../../../src/services/postService';
import { requireAuthForChat, requireAuthForHeart } from '../../../src/utils/authGuard';
import { trackEvent } from '../../../src/services/gtm';
import { Alert } from '../../../src/utils/alert';

type MainTab = 'POOL' | 'CONTEST' | 'POST';
type SortFilter = 'ALL' | 'LATEST' | 'POPULAR';

const SORT_OPTIONS: { key: SortFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'LATEST', label: '최신순' },
  { key: 'POPULAR', label: '인기순' },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  // 홈 화면의 "더보기" 버튼에서 특정 서브탭/정렬로 바로 진입시키기 위한 초기값.
  // 탭 네비게이터는 화면을 언마운트하지 않고 유지하는 경우가 많아 useState 초기값만으로는
  // 재진입 시 반영이 안 될 수 있어(messages/index.tsx의 initialTab과 동일한 이유) useEffect로 동기화한다.
  const { tab: tabParam, sort: sortParam } = useLocalSearchParams<{ tab?: string; sort?: string }>();
  const [mainTab, setMainTab] = useState<MainTab>((tabParam as MainTab) || 'POOL');
  const [keyword, setKeyword] = useState('');
  const [sortFilter, setSortFilter] = useState<SortFilter>((sortParam as SortFilter) || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    if (tabParam === 'POOL' || tabParam === 'CONTEST' || tabParam === 'POST') setMainTab(tabParam);
  }, [tabParam]);
  useEffect(() => {
    if (sortParam === 'ALL' || sortParam === 'LATEST' || sortParam === 'POPULAR') setSortFilter(sortParam);
  }, [sortParam]);

  const { data: talents = [], isLoading: talentsLoading, isFetching: talentsFetching } = useExploreTalents();
  const { data: contests = [], isLoading: contestsLoading, isFetching: contestsFetching } = useExploreContests();
  const { data: posts = [], isLoading: postsLoading, isFetching: postsFetching } = useExplorePosts();
  const isLoading = talentsLoading || contestsLoading || postsLoading;
  const isRefreshing = talentsFetching || contestsFetching || postsFetching;
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
      trackEvent('chat_start', { target_user_id: targetUserId });
      router.push(`/explore/chat/${chatRoomId}` as never);
    } catch (e) {
      // 이전엔 로그만 남기고 사용자에게는 아무 반응도 없어서, 버튼을 눌러도 채팅창으로
      // 안 들어가지는 것처럼 보이는 버그였다 — 실패를 사용자에게 알리고 다시 시도하게 한다.
      console.error('[Explore] 채팅방 생성 실패:', e);
      Alert.alert('채팅을 시작하지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  // 검색어는 키 입력마다 보내면 너무 잦아서, 타이핑을 멈춘 뒤(800ms) 한 번만 보낸다
  useEffect(() => {
    if (!keyword.trim()) return;
    const timer = setTimeout(() => {
      trackEvent('explore_search', { keyword: keyword.trim(), tab_name: mainTab.toLowerCase() });
    }, 800);
    return () => clearTimeout(timer);
  }, [keyword, mainTab]);

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

  const filteredPosts = posts.filter((post) =>
    keyword.trim().length === 0
      ? true
      : post.title.includes(keyword) ||
        (post.skills ?? []).some((skill) => skill.toLowerCase().includes(keyword.toLowerCase())),
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortFilter === 'POPULAR') return (b.viewCount ?? 0) - (a.viewCount ?? 0);
    return 0; // LATEST/ALL은 백엔드가 이미 최신순으로 내려준다
  });

  if (isLoading && talents.length === 0 && contests.length === 0 && posts.length === 0) {
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
            { key: 'POST', label: '모집글' },
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
          placeholder={
            mainTab === 'POOL'
              ? '이름, 역할, 스킬로 검색'
              : mainTab === 'CONTEST'
                ? '공모전 이름, 주최기관, 분야 검색'
                : '모집글 제목, 스킬로 검색'
          }
          value={keyword}
          onChangeText={setKeyword}
        />

        {(mainTab === 'CONTEST' || mainTab === 'POST') && (
          <View style={styles.filterRow}>
            <FilterPills
              options={SORT_OPTIONS}
              value={sortFilter}
              onChange={(sort) => {
                trackEvent('explore_filter', { filter_type: 'sort', value: sort.toLowerCase() });
                setSortFilter(sort);
              }}
              trailingLabel={mainTab === 'CONTEST' ? '분야별' : undefined}
              onPressTrailing={mainTab === 'CONTEST' ? () => setCategoryModalVisible(true) : undefined}
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
            : mainTab === 'CONTEST'
              ? sortedContests.map((contest) => (
                  <ContestCard
                    key={contest.contestId}
                    contest={contest}
                    variant="full"
                    onPress={() => router.push(`/explore/contest/${contest.contestId}` as never)}
                    onPressHeart={() => toggleContestHeart(contest.contestId)}
                  />
                ))
              : sortedPosts.map((post) => (
                  <RecruitPostCard
                    key={post.postId}
                    post={adaptToRecruitPost(post)}
                    showContestBadge
                    onPress={() => router.push(`/explore/post/${post.postId}` as never)}
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
          trackEvent('explore_filter', { filter_type: 'category', value: cat.toLowerCase() });
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
