import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { getReceivedApplicationPosts } from '../../../src/services/mypageService';
import { ReceivedApplicationPost, TalentPoolCandidate } from '../../../src/types/mypage';

function CandidateRow({ candidate }: { candidate: TalentPoolCandidate }) {
  return (
    <View style={styles.candidateRow}>
      <View style={styles.candidateAvatar}>
        <Text style={styles.candidateAvatarText}>🧑‍💻</Text>
      </View>
      <View style={styles.candidateInfo}>
        <Text style={styles.candidateName}>{candidate.nickname}</Text>
        <Text style={styles.candidateSkills} numberOfLines={1}>
          {candidate.skills.join(', ')}
        </Text>
        <Text style={styles.candidateStyle}>
          {candidate.workStyle} · {candidate.intensity}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.proposeBtn}
        onPress={() =>
          Alert.alert('제안하기', `${candidate.nickname}님께 제안을 보낼까요?`)
        }
      >
        <Text style={styles.proposeBtnText}>제안하기</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ReceivedApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<ReceivedApplicationPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReceivedApplicationPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="내 모집글" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="내 모집글" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyTitle}>아직 내 모집글이 없어요</Text>
          <Text style={styles.emptyDesc}>모집글을 작성하고 팀원을 모집해보세요</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.emptyBtnText}>공모전 탐색하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="내 모집글" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {posts.map((post) => (
          <View key={post.postId} style={styles.postCard}>
            {/* 카드 헤더: 공모전명 + 수정 버튼 */}
            <TouchableOpacity
              style={styles.postHeader}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/profile/post/[postId]',
                  params: {
                    postId: post.postId,
                    contestId: post.contestId,
                    fromMyPosts: 'true',
                  },
                })
              }
            >
              <View style={styles.postHeaderLeft}>
                <Text style={styles.postContest}>{post.contestTitle}</Text>
                <Text style={styles.postTitle} numberOfLines={2}>{post.postTitle}</Text>
                <Text style={styles.postMeta}>작성일: {post.createdAt}</Text>
              </View>
              <View style={styles.postHeaderRight}>
                <View style={styles.applicantBadge}>
                  <Text style={styles.applicantBadgeText}>지원자 {post.applicantCount}명</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.talentPoolSection}>
              <Text style={styles.talentPoolTitle}>해당 공모전에 후보 등록한 인재풀</Text>
              {post.talentPool.length === 0 ? (
                <Text style={styles.noTalent}>인재풀에 등록된 후보가 없어요</Text>
              ) : (
                post.talentPool.map((candidate) => (
                  <CandidateRow key={candidate.userId} candidate={candidate} />
                ))
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontSize: 14, color: Colors.grayMedium },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark, marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: Colors.gray, textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.primary,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  postCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  postHeaderLeft: { flex: 1, marginRight: 10 },
  postHeaderRight: { alignItems: 'flex-end', gap: 8 },
  postContest: { fontSize: 12, color: Colors.gray, marginBottom: 4 },
  postTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  postMeta: { fontSize: 12, color: Colors.grayMedium },
  applicantBadge: {
    backgroundColor: Colors.ogTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  applicantBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  talentPoolSection: { padding: 16 },
  talentPoolTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: 8,
  },
  noTalent: { fontSize: 13, color: Colors.grayMedium, textAlign: 'center', paddingVertical: 8 },

  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  candidateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  candidateAvatarText: { fontSize: 20 },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  candidateSkills: { fontSize: 12, color: Colors.gray, marginTop: 2 },
  candidateStyle: { fontSize: 12, color: Colors.grayMedium, marginTop: 1 },
  proposeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  proposeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.white },
});
