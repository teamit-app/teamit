import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { ScreenHeader } from '../../../../src/components/common/ScreenHeader';
import { dummyRecruitPostDetails } from '../../../../src/data/recruitmentPosts';
import { declineInvitation, acceptInvitation } from '../../../../src/services/invitationService';
import { useRecruitPostStore } from '../../../../src/store/useRecruitPostStore';
import { TeamMember, PostComment } from '../../../../src/types/contest';

// ── 팀원 아바타 ──────────────────────────────────────────────────────────────
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

function SectionHeading({ title }: { title: string }) {
  return <Text style={sectionStyles.heading}>{title}</Text>;
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.infoBlock}>
      <Text style={sectionStyles.infoLabel}>{label}</Text>
      {children}
    </View>
  );
}

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
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; authorName: string } | null>(null);
  const inputRef = useRef<import('react-native').TextInput>(null);

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  const iid = Number(invitationId);
  const pid = Number(postId);

  const userPosts = useRecruitPostStore((s) => s.userPosts);

  const post =
    userPosts.find((p) => p.postId === pid) ??
    dummyRecruitPostDetails.find((p) => p.postId === pid) ??
    dummyRecruitPostDetails[0];

  const [comments, setComments] = useState(post.comments);
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
    } catch (_) {}
    router.replace('/(tabs)/messages' as never);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="모집글 상세" onBack={() => router.back()} />

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
            {post.members.map((m) => (
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
            onPress={() => router.push(`/explore/post/recruiter-profile?postId=${pid}` as never)}
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
            {post.recruiter.skills.map((skill) => (
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
            <InfoBlock label="리더십">
              <Text style={sectionStyles.infoValue}>{post.recruiter.leadershipStyle}</Text>
            </InfoBlock>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── 댓글 ── */}
        <View style={styles.card}>
          <SectionHeading title={`댓글 ${visibleComments.length}`} />

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
