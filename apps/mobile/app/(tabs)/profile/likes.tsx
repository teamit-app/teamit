import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { TalentCard } from '../../../src/components/explore/TalentCard';
import { ContestCard } from '../../../src/components/explore/ContestCard';
import { getHeartedTalents } from '../../../src/services/talentService';
import { getHeartedContests } from '../../../src/services/contestService';
import { getLikedPosts } from '../../../src/services/mypageService';
import { getOrCreateDirectChatRoom } from '../../../src/services/messageService';
import { requireAuthForChat } from '../../../src/utils/authGuard';
import { Alert } from '../../../src/utils/alert';
import { toggleTalentHeart as toggleTalentHeartInStore, toggleContestHeart as toggleContestHeartInStore } from '../../../src/hooks/useExploreData';
import { LikedPost } from '../../../src/types/mypage';
import { PoolUser } from '../../../src/types/talent';
import { Contest } from '../../../src/types/contest';
import { trackEvent } from '../../../src/services/gtm';

type Tab = 'TALENT' | 'CONTEST' | 'POST';
type PostFilter = 'ALL' | 'OPEN' | 'CLOSED';

const POST_FILTER_OPTIONS: { key: PostFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'OPEN', label: '모집중' },
  { key: 'CLOSED', label: '마감' },
];

function LikedPostCard({ post, onPress }: { post: LikedPost; onPress: () => void }) {
  return (
    <TouchableOpacity style={postCard.container} onPress={onPress} activeOpacity={0.85}>
      <View style={postCard.topRow}>
        <View style={[postCard.statusChip, post.isOpen ? postCard.statusOpen : postCard.statusClosed]}>
          <Text style={[postCard.statusText, post.isOpen ? postCard.statusTextOpen : postCard.statusTextClosed]}>
            {post.isOpen ? '모집중' : '마감'}
          </Text>
        </View>
        <View style={postCard.dDayBadge}>
          <Text style={postCard.dDayText}>
            {post.dDay >= 0 ? `D-${post.dDay}` : '마감'}
          </Text>
        </View>
      </View>

      <Text style={postCard.contestTitle}>{post.contestTitle}</Text>
      <Text style={postCard.postTitle} numberOfLines={2}>{post.postTitle}</Text>

      <View style={postCard.roleRow}>
        {post.roles.map((role) => (
          <View key={role} style={postCard.roleTag}>
            <Text style={postCard.roleTagText}>{role}</Text>
          </View>
        ))}
      </View>

      <View style={postCard.bottomRow}>
        <Text style={postCard.meta}>팀원 {post.teamSize}명 · 마감 {post.deadline}</Text>
        <Text style={postCard.heart}>♥</Text>
      </View>
    </TouchableOpacity>
  );
}

const postCard = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusOpen: { backgroundColor: '#ffedde' },
  statusClosed: { backgroundColor: Colors.pageBg },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextOpen: { color: '#ff6a1c' },
  statusTextClosed: { color: Colors.grayMedium },
  dDayBadge: {
    backgroundColor: Colors.ogTint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dDayText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  contestTitle: { fontSize: 12, color: Colors.gray, marginBottom: 4 },
  postTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 10 },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  roleTag: {
    backgroundColor: Colors.roleTagBg,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleTagText: { fontSize: 12, color: Colors.roleTagText, fontWeight: '500' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: { fontSize: 12, color: Colors.grayMedium },
  heart: { fontSize: 18, color: '#ff6a1c' },
});

export default function LikesScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('TALENT');
  const [postFilter, setPostFilter] = useState<PostFilter>('ALL');

  const handleTabPress = (key: Tab) => {
    trackEvent('tab_select', { tab_group: 'likes_menu', tab_name: key.toLowerCase(), from_tab: tab.toLowerCase() });
    setTab(key);
  };

  const [likedTalents, setLikedTalents] = useState<PoolUser[]>([]);
  const [likedContests, setLikedContests] = useState<Contest[]>([]);
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getHeartedTalents().catch(() => [] as PoolUser[]),
      getHeartedContests().catch(() => [] as Contest[]),
      getLikedPosts().catch(() => [] as LikedPost[]),
    ])
      .then(([t, c, p]) => {
        setLikedTalents(t);
        setLikedContests(c);
        setLikedPosts(p);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // 좋아요 목록 화면에서는 항상 "취소"만 가능 — 목록에서 바로 제거
  // useExploreData의 toggleTalentHeart를 거쳐야 탐색 탭 목록/상세정보에도 그대로 반영된다
  const removeTalentLike = async (targetUserId: number) => {
    const prev = likedTalents;
    setLikedTalents((cur) => cur.filter((t) => t.userId !== targetUserId));
    try {
      await toggleTalentHeartInStore(targetUserId, true);
    } catch (e) {
      console.error('[Likes] 팀원 좋아요 취소 실패:', e);
      setLikedTalents(prev);
    }
  };

  const handlePropose = async (targetUserId: number) => {
    if (!requireAuthForChat(`/explore/talent/${targetUserId}`)) return;
    try {
      const chatRoomId = await getOrCreateDirectChatRoom(targetUserId);
      trackEvent('chat_start', { target_user_id: targetUserId });
      router.push(`/explore/chat/${chatRoomId}` as never);
    } catch (e) {
      // 이전엔 로그만 남기고 사용자에게는 아무 반응도 없어서, 버튼을 눌러도 채팅창으로
      // 안 들어가지는 것처럼 보이는 버그였다 — 실패를 사용자에게 알리고 다시 시도하게 한다.
      console.error('[Likes] 채팅방 생성 실패:', e);
      Alert.alert('채팅을 시작하지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  const removeContestLike = async (contestId: number) => {
    const prev = likedContests;
    setLikedContests((cur) => cur.filter((c) => c.contestId !== contestId));
    try {
      await toggleContestHeartInStore(contestId, true);
    } catch (e) {
      console.error('[Likes] 공모전 좋아요 취소 실패:', e);
      setLikedContests(prev);
    }
  };

  const filteredPosts = likedPosts.filter((p) => {
    if (postFilter === 'OPEN') return p.isOpen;
    if (postFilter === 'CLOSED') return !p.isOpen;
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'TALENT', label: '인재풀' },
    { key: 'CONTEST', label: '공모전' },
    { key: 'POST', label: '모집글' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="좋아요 목록" onBack={() => router.back()} />

      {/* 3-탭 세그먼트 */}
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          {tabs.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.segTab, tab === key && styles.segTabActive]}
              onPress={() => handleTabPress(key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segTabText, tab === key && styles.segTabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 모집글 탭 필터 */}
      {tab === 'POST' && (
        <View style={styles.filterRow}>
          {POST_FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterPill, postFilter === opt.key && styles.filterPillActive]}
              onPress={() => setPostFilter(opt.key)}
            >
              <Text style={[styles.filterPillText, postFilter === opt.key && styles.filterPillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>불러오는 중...</Text>
          </View>
        ) : (
          <>
            {tab === 'TALENT' && (
              likedTalents.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🤍</Text>
                  <Text style={styles.emptyText}>좋아요한 인재가 없어요</Text>
                </View>
              ) : likedTalents.map((talent) => (
                <TalentCard
                  key={talent.userId}
                  talent={talent}
                  onPress={() => router.push(`/explore/talent/${talent.userId}` as never)}
                  onPressHeart={() => removeTalentLike(talent.userId)}
                  onPressPropose={() => handlePropose(talent.userId)}
                />
              ))
            )}

            {tab === 'CONTEST' && (
              likedContests.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🤍</Text>
                  <Text style={styles.emptyText}>좋아요한 공모전이 없어요</Text>
                </View>
              ) : likedContests.map((contest) => (
                <ContestCard
                  key={contest.contestId}
                  contest={contest}
                  variant="full"
                  onPress={() => router.push(`/profile/contest/${contest.contestId}?source=likes` as never)}
                  onPressHeart={() => removeContestLike(contest.contestId)}
                />
              ))
            )}

            {tab === 'POST' && (
              filteredPosts.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🤍</Text>
                  <Text style={styles.emptyText}>좋아요한 모집글이 없어요</Text>
                </View>
              ) : filteredPosts.map((post) => (
                <LikedPostCard
                  key={post.postId}
                  post={post}
                  onPress={() =>
                    router.push(`/profile/post/${post.postId}?contestId=${post.contestId}` as never)
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },

  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    padding: 4,
  },
  segTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  segTabActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segTabText: { fontSize: 14, fontWeight: '600', color: Colors.gray },
  segTabTextActive: { color: Colors.primary },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: { fontSize: 13, color: Colors.grayMedium },
  filterPillTextActive: { color: Colors.white, fontWeight: '600' },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 14, color: Colors.grayMedium },
});
