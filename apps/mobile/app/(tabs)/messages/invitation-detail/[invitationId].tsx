import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { ScreenHeader } from '../../../../src/components/common/ScreenHeader';
import { PostDetailContent } from '../../../../src/components/explore/PostDetailContent';
import { getPostDetail, adaptToRecruitPostDetail } from '../../../../src/services/postService';
import { declineInvitation, acceptInvitation } from '../../../../src/services/invitationService';
import { RecruitPostDetail } from '../../../../src/types/contest';
import { Alert } from '../../../../src/utils/alert';

// ── 거절 확인 팝업 ─────────────────────────────────────────────────────────
function DeclineModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.title}>초대를 거절할까요?</Text>
          <Text style={modalStyles.body}>
            초대를 거절하면 해당 팀의 초대를{'\n'}더이상 받을 수 없어요.{'\n'}거절하시겠어요?
          </Text>
          <View style={modalStyles.btnRow}>
            <TouchableOpacity
              style={[modalStyles.btn, modalStyles.cancelBtn]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.btn, modalStyles.confirmDeclineBtn]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.confirmDeclineText}>거절하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function InvitationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { invitationId, postId } = useLocalSearchParams<{ invitationId: string; postId: string }>();
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const commentSectionY = useRef(0);

  const iid = Number(invitationId);
  const pid = Number(postId);
  const [post, setPost] = useState<RecruitPostDetail | null>(null);

  useEffect(() => {
    getPostDetail(pid).then((d) => setPost(adaptToRecruitPostDetail(d))).catch(() => {});
  }, [pid]);

  const handleDeclineConfirm = async () => {
    try {
      await declineInvitation(iid);
    } catch (_) {}
    setDeclineModalVisible(false);
    router.back();
  };

  const handleAccept = async () => {
    try {
      await acceptInvitation(iid);
      router.replace('/(tabs)/messages' as never);
    } catch (e) {
      // 수락 전에 모집글이 마감되면 서버가 초대장을 삭제하고 에러를 내려준다 —
      // 그 메시지를 그대로 보여주고 더 이상 유효하지 않은 초대라 목록으로 돌려보낸다
      Alert.alert(
        '초대 수락 실패',
        e instanceof Error ? e.message : '이미 마감된 모집글입니다',
        [{ text: '확인', onPress: () => router.replace('/(tabs)/messages' as never) }],
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="모집글 상세" onBack={() => router.back()} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <PostDetailContent
          post={post}
          postId={pid}
          isOwner={false}
          onCommentSectionLayout={(y) => { commentSectionY.current = y; }}
          onReplyStart={() =>
            scrollRef.current?.scrollTo({ y: Math.max(commentSectionY.current - 12, 0), animated: true })
          }
        />

      </ScrollView>

      {/* ── 하단 바 ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.acceptHint}>수락 시 팀 채팅방에 바로 입장됩니다</Text>
        <View style={styles.bottomBtnRow}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => setDeclineModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.declineBtnText}>거절하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
            <Text style={styles.acceptBtnText}>초대 수락하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 거절 팝업 ── */}
      <DeclineModal
        visible={declineModalVisible}
        onCancel={() => setDeclineModalVisible(false)}
        onConfirm={handleDeclineConfirm}
      />
    </KeyboardAvoidingView>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // 하단 바
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  acceptHint: {
    fontSize: 12,
    color: Colors.grayMedium,
    textAlign: 'center',
    marginBottom: 10,
  },
  bottomBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: Colors.pageBg,
  },
  declineBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.grayMedium,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  box: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: Colors.grayMedium,
    lineHeight: 22,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.pageBg,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.grayMedium,
  },
  confirmDeclineBtn: {
    backgroundColor: Colors.primary,
  },
  confirmDeclineText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
