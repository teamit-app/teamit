import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
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
type SortFilter = 'LATEST' | 'POPULAR';

const SORT_OPTIONS: { key: SortFilter; label: string }[] = [
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
  // 검색어는 서버가 전체 데이터셋에서 필터링해주므로(로드된 페이지 안에서만 찾는 게 아님),
  // 매 키 입력마다 새 쿼리를 쏘지 않도록 타이핑이 멈춘 뒤(400ms)에만 실제 조회에 반영한다.
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [sortFilter, setSortFilter] = useState<SortFilter>((sortParam as SortFilter) || 'LATEST');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    if (tabParam === 'POOL' || tabParam === 'CONTEST' || tabParam === 'POST') setMainTab(tabParam);
  }, [tabParam]);
  useEffect(() => {
    if (sortParam === 'LATEST' || sortParam === 'POPULAR') setSortFilter(sortParam);
  }, [sortParam]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const talentsQuery = useExploreTalents(debouncedKeyword || undefined);
  const contestsQuery = useExploreContests(
    categoryFilter === 'ALL' ? undefined : categoryFilter,
    debouncedKeyword || undefined,
  );
  const postsQuery = useExplorePosts(sortFilter, debouncedKeyword || undefined);

  const talents = talentsQuery.data?.pages.flatMap((p) => p.content) ?? [];
  const contests = contestsQuery.data?.pages.flatMap((p) => p.content) ?? [];
  const posts = postsQuery.data?.pages.flatMap((p) => p.content) ?? [];

  const isLoading = talentsQuery.isLoading || contestsQuery.isLoading || postsQuery.isLoading;
  const isRefreshing = talentsQuery.isFetching || contestsQuery.isFetching || postsQuery.isFetching;
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

  // 검색어(keyword)/카테고리/모집글 정렬은 전부 서버 쿼리 파라미터로 넘어가서 이미 필터링돼
  // 오므로 여기서 다시 거를 필요가 없다. 공모전 "인기순"만 서버가 지원하지 않아(항상
  // 최신순으로만 페이징) 지금까지 로드된 페이지 안에서 좋아요 수 기준으로 클라이언트가
  // 재정렬한다(홈 화면 "인기 공모전"과 동일한 기준 — ContestService 참고) — 더 불러올수록
  // 정렬 대상도 늘어난다.
  const sortedContests = [...contests].sort((a, b) => {
    if (sortFilter === 'POPULAR') return (b.heartCount ?? 0) - (a.heartCount ?? 0);
    return 0;
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

  const header = (
    <>
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
      <View style={styles.listSpacer} />
    </>
  );

  const footerHint = (
    <Text style={styles.footerHint}>우측 상단 하트에서 좋아요 목록을 확인할 수 있어요</Text>
  );

  const listFooter = (isFetchingNextPage: boolean) => (
    <>
      {isFetchingNextPage && (
        <ActivityIndicator size="small" color={Colors.primary} style={styles.footerLoading} />
      )}
      {footerHint}
    </>
  );

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

      {mainTab === 'POOL' && (
        <FlatList
          data={talents}
          keyExtractor={(talent) => String(talent.userId)}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetchExploreData} tintColor={Colors.primary} />
          }
          ListHeaderComponent={header}
          ListFooterComponent={listFooter(talentsQuery.isFetchingNextPage)}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (talentsQuery.hasNextPage && !talentsQuery.isFetchingNextPage) talentsQuery.fetchNextPage();
          }}
          renderItem={({ item: talent }) => (
            <TalentCard
              talent={talent}
              isMe={talent.userId === currentUserId}
              onPress={() => router.push(`/explore/talent/${talent.userId}` as never)}
              onPressHeart={() => toggleTalentHeart(talent.userId, talent.isHearted)}
              onPressPropose={() => handlePropose(talent.userId)}
            />
          )}
        />
      )}

      {mainTab === 'CONTEST' && (
        <FlatList
          data={sortedContests}
          keyExtractor={(contest) => String(contest.contestId)}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetchExploreData} tintColor={Colors.primary} />
          }
          ListHeaderComponent={header}
          ListFooterComponent={listFooter(contestsQuery.isFetchingNextPage)}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (contestsQuery.hasNextPage && !contestsQuery.isFetchingNextPage) contestsQuery.fetchNextPage();
          }}
          renderItem={({ item: contest }) => (
            <ContestCard
              contest={contest}
              variant="full"
              onPress={() => router.push(`/explore/contest/${contest.contestId}?source=explore` as never)}
              onPressHeart={() => toggleContestHeart(contest.contestId)}
            />
          )}
        />
      )}

      {mainTab === 'POST' && (
        <FlatList
          data={posts}
          keyExtractor={(post) => String(post.postId)}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetchExploreData} tintColor={Colors.primary} />
          }
          ListHeaderComponent={header}
          ListFooterComponent={listFooter(postsQuery.isFetchingNextPage)}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) postsQuery.fetchNextPage();
          }}
          renderItem={({ item: post }) => (
            <RecruitPostCard
              post={adaptToRecruitPost(post)}
              showContestBadge
              onPress={() => router.push(`/explore/post/${post.postId}` as never)}
            />
          )}
        />
      )}

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
  listSpacer: {
    height: 16,
  },
  footerHint: {
    fontSize: 12,
    color: Colors.grayLight,
    textAlign: 'center',
    marginTop: 4,
  },
  footerLoading: {
    marginBottom: 12,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
