import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert } from '../../../../src/utils/alert';
import { router, useLocalSearchParams, useSegments, useFocusEffect } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { ScreenHeader } from '../../../../src/components/common/ScreenHeader';
import { ApplyRequiredBottomSheet } from '../../../../src/components/explore/ApplyRequiredBottomSheet';
import { PostDetailContent } from '../../../../src/components/explore/PostDetailContent';
import {
  getPostDetail,
  adaptToRecruitPostDetail,
  applyToPost,
  addPostHeart,
  removePostHeart,
  deletePost,
} from '../../../../src/services/postService';
import { checkIsParticipant } from '../../../../src/services/contestService';
import { cancelPostApplication } from '../../../../src/services/mypageService';
import { useAuthStore } from '../../../../src/store/useAuthStore';
import { requireAuth } from '../../../../src/utils/authGuard';
import { RecruitPostDetail } from '../../../../src/types/contest';

// ── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const { postId, contestId, appliedStatus, applicationId } = useLocalSearchParams<{
    postId: string;
    contestId: string;
    appliedStatus?: string;
    applicationId?: string;
  }>();
  const [applySheetVisible, setApplySheetVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isHearted, setIsHearted] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [post, setPost] = useState<RecruitPostDetail | null>(null);
  const [hasApplied, setHasApplied] = useState(appliedStatus === 'applied');
  const [myApplicationId, setMyApplicationId] = useState<number | null>(
    applicationId ? Number(applicationId) : null,
  );
  const [hasRegistered, setHasRegistered] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const commentSectionY = useRef(0);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const isOwner = post?.ownerUserId != null && post.ownerUserId === currentUserId;
  const segments = useSegments();
  const sourceTab = (segments[1] as string) ?? 'explore';

  const id = Number(postId);
  // URL에 contestId가 안 넘어온 경우를 대비해 조회된 모집글 자체의 contestId로 폴백
  // (이 값이 없으면 참여카드 등록 여부 체크가 조용히 스킵되어 항상 "미등록"으로 보임)
  const cid = Number(contestId) || post?.contestId || 0;

  useEffect(() => {
    if (cid) {
      checkIsParticipant(cid).then(setHasRegistered).catch(() => {});
    }
  }, [cid]);

  useFocusEffect(
    useCallback(() => {
      getPostDetail(id)
        .then((d) => {
          setPost(adaptToRecruitPostDetail(d));
          setIsHearted(d.isHearted ?? false);
          setLikeCount(d.likeCount ?? 0);
          setHasApplied(d.isApplied ?? false);
          setMyApplicationId(d.myApplicationId ?? null);
        })
        .catch(() => {});
    }, [id]),
  );

  const handleToggleHeart = async () => {
    const next = !isHearted;
    setIsHearted(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      if (next) {
        await addPostHeart(id);
      } else {
        await removePostHeart(id);
      }
    } catch (e) {
      setIsHearted(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  };

  const handleApply = async () => {
    if (!requireAuth(`/${sourceTab}/post/${id}?contestId=${cid}`)) return;
    if (!hasRegistered || hasApplied) {
      if (!hasRegistered) setApplySheetVisible(true);
      return;
    }
    try {
      const res = await applyToPost(id);
      setHasApplied(true);
      setMyApplicationId(res.applicationId);
    } catch (e) {
      console.error('[PostDetail] 지원 실패:', e);
      Alert.alert('오류', '지원에 실패했어요. 다시 시도해주세요.');
    }
  };

  const handleCancelApplication = () => {
    if (!myApplicationId) return;
    Alert.alert(
      '지원 취소',
      '지원을 취소해도 공모전 후보 등록은 계속 유지돼요.\n지원을 취소하시겠어요?',
      [
        { text: '아니요', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            await cancelPostApplication(myApplicationId);
            setHasApplied(false);
            setMyApplicationId(null);
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        title="모집글 상세"
        onBack={() => router.back()}
        rightElement={
          isOwner ? (
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              hitSlop={8}
              activeOpacity={0.7}
              style={{ padding: 4, alignItems: 'center', gap: 3 }}
            >
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.dark }} />
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.dark }} />
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.dark }} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <PostDetailContent
          post={post}
          postId={id}
          isOwner={isOwner}
          onCommentSectionLayout={(y) => { commentSectionY.current = y; }}
          onReplyStart={() =>
            scrollRef.current?.scrollTo({ y: Math.max(commentSectionY.current - 12, 0), animated: true })
          }
        />

      </ScrollView>

      {/* ── 하단 바 ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.heartWrap}
          onPress={handleToggleHeart}
          activeOpacity={0.8}
        >
          <Text style={[styles.heartIcon, isHearted && styles.heartIconFilled]}>
            {isHearted ? '♥' : '♡'}
          </Text>
          <Text style={styles.heartCount}>{likeCount}</Text>
        </TouchableOpacity>

        {isOwner ? (
          <View style={styles.applyBtnDone}>
            <Text style={styles.applyBtnDoneText}>내가 올린 글</Text>
          </View>
        ) : hasApplied ? (
          myApplicationId ? (
            <TouchableOpacity
              style={styles.cancelApplicationBtn}
              onPress={handleCancelApplication}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelApplicationBtnText}>지원 취소</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.applyBtnDone}>
              <Text style={styles.applyBtnDoneText}>지원 완료</Text>
            </View>
          )
        ) : post?.status === 'CLOSED' ? (
          <View style={styles.applyBtnClosed}>
            <Text style={styles.applyBtnClosedText}>마감된 모집글이에요</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Text style={styles.applyBtnText}>
              {hasRegistered ? '지원하기' : '참여카드 등록 후 지원'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── 수정/삭제 바텀 시트 ── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={menuStyles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[menuStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={menuStyles.handle} />
          <TouchableOpacity
            style={menuStyles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              setMenuVisible(false);
              // 합류한 팀원이 아직 없으면(모집자 본인뿐이면) 모집 조건 전체를 다시 설정하는
              // 위저드로, 팀원이 있으면 어필글만 고치는 화면으로 보낸다
              const noTeamMembersYet = (post?.currentMembers ?? 1) <= 1;
              if (noTeamMembersYet) {
                router.push({
                  pathname: '/(tabs)/explore/build-team/recruit-count',
                  params: { contestId: cid, editPostId: id, sourceTab, fullEdit: 'true' },
                });
              } else {
                router.push({
                  pathname: '/(tabs)/explore/build-team/recruit-post',
                  params: { contestId: cid, editPostId: id, sourceTab },
                });
              }
            }}
          >
            <Text style={menuStyles.menuItemText}>수정하기</Text>
          </TouchableOpacity>
          <View style={menuStyles.separator} />
          <TouchableOpacity
            style={menuStyles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              setMenuVisible(false);
              Alert.alert(
                '모집글 삭제',
                '모집글을 삭제하면 채팅방도 함께 사라지고, 팀원과 지원자 전원에게 삭제 알림이 가요.\n이 작업은 되돌릴 수 없어요. 정말로 삭제하시겠습니까?',
                [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '삭제하기',
                    style: 'destructive',
                    onPress: async () => {
                      await deletePost(id);
                      router.back();
                    },
                  },
                ],
              );
            }}
          >
            <Text style={[menuStyles.menuItemText, menuStyles.deleteText]}>삭제하기</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <ApplyRequiredBottomSheet
        visible={applySheetVisible}
        onGoRegister={() => {
          setApplySheetVisible(false);
          router.push(`/explore/participate?contestId=${cid}` as never);
        }}
        onClose={() => setApplySheetVisible(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    gap: 16,
  },
  heartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
  },
  heartIcon: {
    fontSize: 22,
    color: Colors.grayMedium,
  },
  heartIconFilled: {
    color: Colors.primary,
  },
  heartCount: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginTop: 2,
  },
  applyBtn: {
    // 참여카드 미등록 상태에서도 눌리는(참여카드 등록으로 이동하는) 버튼이라
    // 회색으로 비활성처럼 보이면 안 된다 — 항상 활성화된 주황 버튼으로 보여준다
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  applyBtnDone: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  applyBtnDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.grayMedium,
  },
  applyBtnClosed: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  applyBtnClosedText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.grayMedium,
  },
  cancelApplicationBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E57373',
  },
  cancelApplicationBtnText: { fontSize: 16, fontWeight: '700', color: '#E57373' },
});

const menuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.lightGray,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  menuItem: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  deleteText: {
    color: '#E53935',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginHorizontal: 20,
  },
});

