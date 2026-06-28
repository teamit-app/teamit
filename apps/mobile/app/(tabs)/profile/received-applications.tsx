import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { getReceivedApplicationPosts } from '../../../src/services/mypageService';
import { ReceivedApplicationPost } from '../../../src/types/mypage';

export default function ReceivedApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<ReceivedApplicationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<ReceivedApplicationPost | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    getReceivedApplicationPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  const openModal = (post: ReceivedApplicationPost) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPost(null);
  };

  const handleGoToPost = () => {
    if (!selectedPost) return;
    closeModal();
    router.push({
      pathname: '/(tabs)/profile/post/[postId]',
      params: {
        postId: selectedPost.postId,
        contestId: selectedPost.contestId,
        fromMyPosts: 'true',
      },
    });
  };

  const handleGoToApplicants = () => {
    if (!selectedPost) return;
    closeModal();
    router.push({
      pathname: '/(tabs)/profile/applicants',
      params: {
        postId: selectedPost.postId,
        postTitle: selectedPost.postTitle,
        contestTitle: selectedPost.contestTitle,
      },
    });
  };

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
          <TouchableOpacity
            key={post.postId}
            style={styles.postCard}
            activeOpacity={0.7}
            onPress={() => openModal(post)}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.postContest}>{post.contestTitle}</Text>
              <Text style={styles.postTitle} numberOfLines={2}>{post.postTitle}</Text>
              <Text style={styles.postMeta}>작성일: {post.createdAt}</Text>
            </View>
            <View style={styles.cardRight}>
              <View style={styles.applicantBadge}>
                <Text style={styles.applicantBadgeText}>지원자 {post.applicantCount}명</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 모집글 관리 옵션 모달 */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeModal}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>모집글 관리</Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>{selectedPost?.postTitle}</Text>

            <View style={styles.modalDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleGoToPost} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>📝</Text>
              <View style={styles.menuTexts}>
                <Text style={styles.menuItemTitle}>모집글 확인 및 수정하기</Text>
                <Text style={styles.menuItemSub}>작성한 모집글의 내용 확인 및 수정</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleGoToApplicants} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>👥</Text>
              <View style={styles.menuTexts}>
                <Text style={styles.menuItemTitle}>지원자 및 후보자 확인하기</Text>
                <Text style={styles.menuItemSub}>해당 모집글 지원자와 공모전 후보자 목록 확인</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardLeft: { flex: 1, marginRight: 10 },
  cardRight: { alignItems: 'flex-end' },
  postContest: { fontSize: 12, color: Colors.gray, marginBottom: 4 },
  postTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  postMeta: { fontSize: 12, color: Colors.grayMedium },
  applicantBadge: {
    backgroundColor: '#ffedde',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  applicantBadgeText: { fontSize: 12, fontWeight: '600', color: '#ff6a1c' },

  // 모달
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    width: 318,
    borderRadius: 20,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuIcon: { fontSize: 20 },
  menuTexts: { flex: 1 },
  menuItemTitle: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  menuItemSub: { fontSize: 12, color: Colors.grayMedium, marginTop: 2 },
});
