import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { ScreenHeader } from '../../../../src/components/common/ScreenHeader';
import { ApplyRequiredBottomSheet } from '../../../../src/components/explore/ApplyRequiredBottomSheet';
import { getPostDetail } from '../../../../src/services/postService';
import { TeamMember, PostComment, RecruitPostDetail } from '../../../../src/types/contest';

// ── 팀원 아바타 ─────────────────────────────────────────────────────────────
function MemberAvatar({ member }: { member: TeamMember }) {
  if (member.isRecruiting) {
    return (
      <View style={avatarStyles.wrap}>
        <View style={avatarStyles.recruitingCircle}>
          <Text style={avatarStyles.plus}>+</Text>
        </View>
        <Text style={avatarStyles.name}>모집중</Text>
      </View>
    );
  }
  return (
    <View style={avatarStyles.wrap}>
      <View style={[avatarStyles.circle, member.isHost && avatarStyles.hostCircle]}>
        <Text style={avatarStyles.emoji}>{member.isHost ? '👑' : '👤'}</Text>
      </View>
      <Text style={avatarStyles.name} numberOfLines={1}>{member.name}</Text>
    </View>
  );
}

// ── 댓글 아이템 ──────────────────────────────────────────────────────────────
function CommentItem({
  comment,
  onReply,
}: {
  comment: PostComment;
  onReply?: () => void;
}) {
  return (
    <View style={[commentStyles.item, comment.isReply && commentStyles.itemReply]}>
      <View style={commentStyles.headerRow}>
        <View style={commentStyles.authorLeft}>
          <View style={[
            commentStyles.avatar,
            comment.isAuthor && commentStyles.avatarHost,
            comment.isReply && commentStyles.avatarReply,
          ]}>
            <Text style={[commentStyles.avatarEmoji, comment.isReply && commentStyles.avatarEmojiReply]}>
              {comment.isAuthor ? '👑' : '🙋'}
            </Text>
          </View>
          <View style={commentStyles.nameWrap}>
            <View style={commentStyles.nameRow}>
              <Text style={commentStyles.authorName}>{comment.authorName}</Text>
              {comment.isAuthor && (
                <View style={commentStyles.authorBadge}>
                  <Text style={commentStyles.authorBadgeText}>작성자</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <Text style={commentStyles.time}>{comment.createdAt}</Text>
      </View>
      {!!comment.content && (
        <Text style={[commentStyles.content, comment.isReply && commentStyles.contentReply]}>
          {comment.content}
        </Text>
      )}
      {!comment.isReply && onReply && (
        <TouchableOpacity
          style={commentStyles.replyBtn}
          onPress={onReply}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Text style={commentStyles.replyBtnText}>답글 달기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── 섹션 헤더 ────────────────────────────────────────────────────────────────
function SectionHeading({ title }: { title: string }) {
  return <Text style={sectionStyles.heading}>{title}</Text>;
}

// ── 레이블 + 값 행 ────────────────────────────────────────────────────────────
function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sectionStyles.infoBlock}>
      <Text style={sectionStyles.infoLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const { postId, contestId, appliedStatus, fromMyPosts } = useLocalSearchParams<{
    postId: string;
    contestId: string;
    appliedStatus?: string;
    fromMyPosts?: string;
  }>();
  const [applySheetVisible, setApplySheetVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isHearted, setIsHearted] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; authorName: string } | null>(null);
  const [post, setPost] = useState<RecruitPostDetail | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<import('react-native').TextInput>(null);

  const id = Number(postId);
  const cid = Number(contestId);

  useEffect(() => {
    getPostDetail(id)
      .then((data) => {
        setPost(data);
        setComments((data.comments ?? []) as PostComment[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  const hasRegistered = false;

  const visibleComments = comments.filter((c) => !!c.content);

  const handleSend = () => {
    const text = commentText.trim();
    if (!text) return;
    const newComment = {
      commentId: Date.now(),
      authorName: '나',
      content: text,
      createdAt: '방금 전',
      isAuthor: false,
      isReply: !!replyingTo,
    };
    setComments((prev) => {
      if (!replyingTo) return [...prev, newComment];
      const parentIdx = prev.findIndex((c) => c.commentId === replyingTo.commentId);
      if (parentIdx === -1) return [...prev, newComment];
      // 부모 댓글 바로 뒤, 기존 답글들 다음 위치에 삽입
      let insertIdx = parentIdx + 1;
      while (insertIdx < prev.length && prev[insertIdx].isReply) insertIdx++;
      const updated = [...prev];
      updated.splice(insertIdx, 0, newComment);
      return updated;
    });
    setCommentText('');
    setReplyingTo(null);
    Keyboard.dismiss();
  };
  const heartCount = (post?.likeCount ?? 0) + (isHearted ? 1 : 0);

  const handleApply = () => {
    if (!hasRegistered) {
      setApplySheetVisible(true);
    }
  };

  if (loading || !post) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScreenHeader title="모집글 상세" onBack={() => router.back()} />
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        title="모집글 상세"
        onBack={() => router.back()}
        rightElement={
          fromMyPosts === 'true' ? (
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              hitSlop={8}
              activeOpacity={0.7}
              style={{ padding: 4 }}
            >
              <Text style={{ fontSize: 22, color: Colors.dark, letterSpacing: 2 }}>•••</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── 배너 ── */}
        <View style={styles.banner}>
          <View style={styles.bannerIconCircle}>
            <Text style={styles.bannerIcon}>🏆</Text>
          </View>
          <Text style={styles.bannerTitle}>{post.title}</Text>
          <Text style={styles.bannerMeta}>
            {post.createdAt} · 조회 {post.views} · 채팅 {post.chatCount}
          </Text>
        </View>

        {/* ── 참가 공모전 ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>참가 공모전</Text>
          <View style={styles.contestRow}>
            <View style={styles.contestIconCircle}>
              <Text style={styles.contestIcon}>🏆</Text>
            </View>
            <View>
              <Text style={styles.contestName}>{post.contestName}</Text>
              <Text style={styles.contestPeriod}>기간 {post.contestPeriod}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── 현재 팀원 ── */}
        <View style={styles.card}>
          <Text style={styles.memberHeading}>
            현재 팀원 {post.currentMembers}/{post.totalMembers}명
          </Text>
          <View style={styles.memberRow}>
            {((post.members ?? []) as TeamMember[]).map((m) => (
              <MemberAvatar key={m.memberId} member={m} />
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── 모집글 ── */}
        <View style={styles.card}>
          <View style={styles.postBox}>
            <Text style={styles.postBoxLabel}>모집글</Text>
            <Text style={styles.postBoxTitle}>{post.title}</Text>
            <Text style={styles.postBoxContent}>{post.content}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── 모집 조건 ── */}
        <View style={styles.card}>
          <SectionHeading title="모집 조건" />

          <InfoBlock label="모집 인원">
            <Text style={sectionStyles.infoValue}>
              {post.totalMembers}명 (현재 {post.currentMembers}/{post.totalMembers}명 모집 됨)
            </Text>
          </InfoBlock>

          <InfoBlock label="필요 기술">
            <View style={styles.tagRow}>
              {post.skills.map((skill) => (
                <View key={skill} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </InfoBlock>

          <InfoBlock label="성별 · 학교">
            <Text style={sectionStyles.infoValue}>
              {post.genderCondition} / {post.schoolCondition}
            </Text>
          </InfoBlock>

          <InfoBlock label="공모전 경험 조건">
            <Text style={sectionStyles.infoValue}>{post.experienceCondition}</Text>
          </InfoBlock>
        </View>

        <View style={styles.divider} />

        {/* ── 모집자 정보 ── */}
        <View style={styles.card}>
          <SectionHeading title="모집자 정보" />

          <TouchableOpacity
            style={styles.recruiterProfileCard}
            activeOpacity={0.85}
            onPress={() => router.push(`/explore/post/recruiter-profile?postId=${id}` as never)}
          >
            <View style={styles.recruiterAvatarCircle}>
              <Text style={styles.recruiterAvatarEmoji}>👑</Text>
            </View>
            <Text style={styles.recruiterName}>{post.recruiter.name}</Text>
            <View style={styles.chatBtn}>
              <Text style={styles.chatBtnText}>채팅하기</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.tagRow}>
            {(post.recruiter?.skills ?? []).map((skill) => (
              <View key={skill} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>

          <View style={styles.recruiterInfoList}>
            <InfoBlock label="공모전 참여 경험">
              <Text style={sectionStyles.infoValue}>{post.recruiter.experienceCount}</Text>
            </InfoBlock>
            <InfoBlock label="참여 강도">
              <Text style={sectionStyles.infoValue}>{post.recruiter.intensity}</Text>
            </InfoBlock>
            <InfoBlock label="온오프라인선호">
              <Text style={sectionStyles.infoValue}>
                {post.recruiter.meetingType} · {post.recruiter.location}
              </Text>
            </InfoBlock>
            <InfoBlock label="팀 분위기">
              <Text style={sectionStyles.infoValue}>{post.recruiter.teamVibe}</Text>
            </InfoBlock>
            <InfoBlock label="피드백 방식">
              <Text style={sectionStyles.infoValue}>{post.recruiter.feedbackStyle}</Text>
            </InfoBlock>
            <InfoBlock label="리더십">
              <Text style={sectionStyles.infoValue}>{post.recruiter.leadershipStyle}</Text>
            </InfoBlock>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── 댓글 ── */}
        <View style={styles.card}>
          <SectionHeading title={`댓글 ${visibleComments.length}`} />

          {/* 답글 표시 바 */}
          {replyingTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>
                @{replyingTo.authorName} 에게 답글 작성 중
              </Text>
              <TouchableOpacity
                onPress={() => setReplyingTo(null)}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <Text style={styles.replyIndicatorCancel}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 댓글 입력 */}
          <View style={styles.commentInputRow}>
            <TextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder={replyingTo ? '답글을 남겨보세요...' : '댓글을 남겨보세요...'}
              placeholderTextColor={Colors.grayLight}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity style={styles.commentSendBtn} onPress={handleSend} activeOpacity={0.85}>
              <Text style={styles.commentSendIcon}>↑</Text>
            </TouchableOpacity>
          </View>

          {/* 댓글 목록 */}
          <View style={styles.commentList}>
            {visibleComments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                onReply={() => setReplyingTo({ commentId: comment.commentId, authorName: comment.authorName })}
              />
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── 하단 바 ── */}
      {fromMyPosts !== 'true' && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={styles.heartWrap}
            onPress={() => setIsHearted((p) => !p)}
            activeOpacity={0.8}
          >
            <Text style={[styles.heartIcon, isHearted && styles.heartIconFilled]}>
              {isHearted ? '♥' : '♡'}
            </Text>
            <Text style={styles.heartCount}>{heartCount}</Text>
          </TouchableOpacity>

          {appliedStatus === 'applied' ? (
            <View style={styles.applyBtnDone}>
              <Text style={styles.applyBtnDoneText}>지원 완료</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>지원하기</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
              router.push({
                pathname: '/(tabs)/explore/build-team/recruit-post',
                params: { contestId: cid, editPostId: id },
              });
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
              router.back();
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

  // 배너
  banner: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  bannerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  bannerIcon: {
    fontSize: 30,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  bannerMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  // 공통 카드
  card: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  divider: {
    height: 8,
    backgroundColor: Colors.pageBg,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.grayMedium,
    marginBottom: 12,
  },

  // 참가 공모전
  contestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contestIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contestIcon: {
    fontSize: 20,
  },
  contestName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 3,
  },
  contestPeriod: {
    fontSize: 12,
    color: Colors.grayMedium,
  },

  // 현재 팀원
  memberHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // 모집글 박스
  postBox: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
  },
  postBoxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  postBoxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 10,
  },
  postBoxContent: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 22,
  },

  // 스킬 태그
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  skillTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // 모집자 프로필 카드
  recruiterProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  recruiterAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recruiterAvatarEmoji: {
    fontSize: 22,
  },
  recruiterName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  chatBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  recruiterInfoList: {
    marginTop: 16,
  },

  // 댓글
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pageBg,
    borderRadius: 999,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 20,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
    paddingVertical: 6,
  },
  commentSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendIcon: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '700',
  },
  commentList: {
    gap: 0,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.ogTint,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  replyIndicatorText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  replyIndicatorCancel: {
    fontSize: 13,
    color: Colors.grayMedium,
    fontWeight: '600',
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
});

const avatarStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 56,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  hostCircle: {
    backgroundColor: Colors.ogTint,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  recruitingCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 24,
  },
  plus: {
    fontSize: 22,
    color: Colors.grayLight,
    fontWeight: '300',
  },
  name: {
    fontSize: 11,
    color: Colors.gray,
    textAlign: 'center',
  },
});

const sectionStyles = StyleSheet.create({
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 16,
  },
  infoBlock: {
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 21,
  },
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

const commentStyles = StyleSheet.create({
  item: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  itemReply: {
    paddingLeft: 46,
    backgroundColor: Colors.pageBg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHost: {
    backgroundColor: Colors.ogTint,
  },
  avatarReply: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  avatarEmojiReply: {
    fontSize: 14,
  },
  nameWrap: {
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  authorBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  authorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  time: {
    fontSize: 11,
    color: Colors.grayLight,
  },
  content: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 21,
    paddingLeft: 46,
  },
  contentReply: {
    paddingLeft: 0,
  },
  replyBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingLeft: 46,
  },
  replyBtnText: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
});
