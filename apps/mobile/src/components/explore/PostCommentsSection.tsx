import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { Colors } from '../../constants/colors';
import { getPostComments, addPostComment } from '../../services/postService';
import { PostComment } from '../../types/contest';

// 모집글 댓글 섹션 — 모집글 상세(explore/post/[postId].tsx)와 초대장 상세
// (messages/invitation-detail/[invitationId].tsx)에서 공용으로 사용한다.
// 절대 각 화면에 따로 복붙하지 말 것 — 실서버 연동/버그 수정이 한쪽에만 반영되어
// 화면 간 동작이 어긋나는 문제가 실제로 발생했었음.

function CommentItem({
  comment,
  onReply,
}: {
  comment: PostComment;
  onReply?: () => void;
}) {
  // 대댓글에는 답글을 달 수 없음 — 단일 depth만 지원
  const canReply = !comment.isReply && !!onReply;
  return (
    <TouchableOpacity
      style={[styles.item, comment.isReply && styles.itemReply]}
      onPress={canReply ? onReply : undefined}
      activeOpacity={canReply ? 0.7 : 1}
      disabled={!canReply}
    >
      <View style={styles.headerRow}>
        <View style={styles.authorLeft}>
          <View style={[
            styles.avatar,
            comment.isAuthor && styles.avatarHost,
            comment.isReply && styles.avatarReply,
          ]}>
            <Text style={[styles.avatarEmoji, comment.isReply && styles.avatarEmojiReply]}>
              {comment.isAuthor ? '👑' : '🙋'}
            </Text>
          </View>
          <View style={styles.nameWrap}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{comment.authorName}</Text>
              {comment.isAuthor && (
                <View style={styles.authorBadge}>
                  <Text style={styles.authorBadgeText}>작성자</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <Text style={styles.time}>{comment.createdAt}</Text>
      </View>
      {!!comment.content && (
        <Text style={[styles.content, comment.isReply && styles.contentReply]}>
          {comment.content}
        </Text>
      )}
      {canReply && <Text style={styles.replyBtnText}>답글 달기</Text>}
    </TouchableOpacity>
  );
}

interface PostCommentsSectionProps {
  postId: number;
  // 부모 ScrollView 안에서 이 섹션의 y 위치를 알아야 답글 작성 시 스크롤해 보여줄 수 있음
  onSectionLayout?: (y: number) => void;
  // 답글 모드로 진입한 직후 호출 — 부모가 자신의 ScrollView를 이 섹션 위치로 스크롤하는 데 사용
  onReplyStart?: () => void;
}

export function PostCommentsSection({ postId, onSectionLayout, onReplyStart }: PostCommentsSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; authorName: string } | null>(null);
  const inputRef = useRef<TextInput>(null);

  const visibleComments = comments.filter((c) => !!c.content);

  useEffect(() => {
    getPostComments(postId).then(setComments).catch(() => {});
  }, [postId]);

  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  const startReply = (commentId: number, authorName: string) => {
    setReplyingTo({ commentId, authorName });
    onReplyStart?.();
  };

  const handleSend = async () => {
    const text = commentText.trim();
    if (!text) return;
    const parentId = replyingTo?.commentId;
    const replyTarget = replyingTo;
    setCommentText('');
    setReplyingTo(null);
    Keyboard.dismiss();
    try {
      const newComment = await addPostComment(postId, text, parentId);
      setComments((prev) => {
        if (!replyTarget) return [...prev, newComment];
        const parentIdx = prev.findIndex((c) => c.commentId === replyTarget.commentId);
        if (parentIdx === -1) return [...prev, newComment];
        // 부모 댓글 바로 뒤, 기존 답글들 다음 위치에 삽입
        let insertIdx = parentIdx + 1;
        while (insertIdx < prev.length && prev[insertIdx].isReply) insertIdx++;
        const updated = [...prev];
        updated.splice(insertIdx, 0, newComment);
        return updated;
      });
    } catch (e) {
      console.error('[PostCommentsSection] 댓글 등록 실패:', e);
    }
  };

  return (
    <View
      style={styles.card}
      onLayout={onSectionLayout ? (e) => onSectionLayout(e.nativeEvent.layout.y) : undefined}
    >
      <Text style={styles.heading}>{`댓글 ${visibleComments.length}`}</Text>

      {replyingTo && (
        <View style={styles.replyIndicator}>
          <Text style={styles.replyIndicatorText}>
            @{replyingTo.authorName} 에게 답글 작성 중
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={8} activeOpacity={0.7}>
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
            onReply={() => startReply(comment.commentId, comment.authorName)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 16,
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
  replyIndicatorText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  replyIndicatorCancel: { fontSize: 13, color: Colors.grayMedium, fontWeight: '600' },

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
  commentInput: { flex: 1, fontSize: 14, color: Colors.dark, paddingVertical: 6 },
  commentSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendIcon: { fontSize: 14, color: Colors.white, fontWeight: '700' },
  commentList: { gap: 0 },

  item: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  itemReply: { paddingLeft: 46, backgroundColor: Colors.pageBg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHost: { backgroundColor: Colors.ogTint },
  avatarReply: { width: 28, height: 28, borderRadius: 14 },
  avatarEmoji: { fontSize: 18 },
  avatarEmojiReply: { fontSize: 14 },
  nameWrap: { justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  authorBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  authorBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  time: { fontSize: 11, color: Colors.grayLight },
  content: { fontSize: 14, color: Colors.dark, lineHeight: 21, paddingLeft: 46 },
  contentReply: { paddingLeft: 0 },
  replyBtnText: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginTop: 6,
    paddingLeft: 46,
  },
});
