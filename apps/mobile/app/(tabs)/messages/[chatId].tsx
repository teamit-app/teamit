import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { MessageBubble } from '../../../src/components/messages/MessageBubble';
import { MessageInput } from '../../../src/components/messages/MessageInput';
import { getChat, sendMessage, leaveChatRoom } from '../../../src/services/messageService';
import { Chat, Message } from '../../../src/types/message';
export default function ChatDetailScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [matchStatus, setMatchStatus] = useState<
    'pending' | 'accepted' | 'requested' | 'waiting' | 'completed' | 'none'
  >('none');
  const [isMoreSheetVisible, setIsMoreSheetVisible] = useState(false);
  const [isBlockConfirmVisible, setIsBlockConfirmVisible] = useState(false);
  const [isLeaveConfirmVisible, setIsLeaveConfirmVisible] = useState(false);

  useEffect(() => {
    loadChat();
  }, [chatId]);

  const loadChat = async () => {
    setIsLoading(true);
    try {
      const data = await getChat(parseInt(chatId as string));
      if (data) {
        setChat(data);
        setMessages(data.messages);
        setMatchStatus(data.matchStatus ?? 'none');
      }
    } catch (e) {
      console.error('Failed to load chat:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    setIsSending(true);
    try {
      const newMessage = await sendMessage(parseInt(chatId as string), text);
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error('Failed to send:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleMatchAction = () => {
    if (chat?.detailType === 'member-invite') setMatchStatus('accepted');
    if (chat?.detailType === 'leader-request') setMatchStatus('waiting');
  };

  // ────────────────────────────────────────────────
  // Modals
  // ────────────────────────────────────────────────

  const renderMoreSheet = () => (
    <Modal visible={isMoreSheetVisible} animationType="slide" transparent>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} onPress={() => setIsMoreSheetVisible(false)} />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          {chat?.type === 'direct' && (
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setIsMoreSheetVisible(false);
                Alert.alert('개발 중', '차단 기능은 현재 개발 중입니다.');
              }}
            >
              <View style={styles.sheetItemIcon}>
                <Text style={styles.sheetItemIconText}>🚫</Text>
              </View>
              <Text style={styles.sheetItemLabel}>차단하기</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.sheetItem}
            onPress={() => {
                setIsMoreSheetVisible(false);
                Alert.alert('개발 중', '신고 기능은 현재 개발 중입니다.');
              }}
          >
            <View style={styles.sheetItemIcon}>
              <Text style={styles.sheetItemIconText}>⚠️</Text>
            </View>
            <Text style={styles.sheetItemLabel}>신고하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetItem}
            onPress={() => { setIsMoreSheetVisible(false); setIsLeaveConfirmVisible(true); }}
          >
            <View style={styles.sheetItemIcon}>
              <Text style={styles.sheetItemIconText}>🚪</Text>
            </View>
            <Text style={[styles.sheetItemLabel, styles.sheetItemDanger]}>채팅방 나가기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetCloseBtn}
            onPress={() => setIsMoreSheetVisible(false)}
          >
            <Text style={styles.sheetCloseBtnText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderBlockConfirm = () => (
    <Modal visible={isBlockConfirmVisible} animationType="fade" transparent>
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogBox}>
          <Text style={styles.dialogTitle}>상대방을 차단할까요?</Text>
          <Text style={styles.dialogDesc}>
            {`차단하면 ${chat?.name ?? ''}님과 채팅방에서\n대화를 주고받을 수 없어요.\n차단하시겠어요?`}
          </Text>
          <View style={styles.dialogBtns}>
            <TouchableOpacity
              style={styles.dialogBtnCancel}
              onPress={() => setIsBlockConfirmVisible(false)}
            >
              <Text style={styles.dialogBtnCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialogBtnConfirm}
              onPress={() => {
                setIsBlockConfirmVisible(false);
                setTimeout(() => router.back(), 300);
              }}
            >
              <Text style={styles.dialogBtnConfirmText}>차단</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderLeaveConfirm = () => (
    <Modal visible={isLeaveConfirmVisible} animationType="fade" transparent>
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogBox}>
          <Text style={styles.dialogTitle}>채팅방을 나갈까요?</Text>
          <Text style={styles.dialogDesc}>
            {'채팅방을 나가면 채팅 목록 및 대화\n내용이 삭제되고 복구할 수 없어요.\n채팅방에서 나가시겠어요?'}
          </Text>
          <View style={styles.dialogBtns}>
            <TouchableOpacity
              style={styles.dialogBtnCancel}
              onPress={() => setIsLeaveConfirmVisible(false)}
            >
              <Text style={styles.dialogBtnCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialogBtnConfirm}
              onPress={async () => {
                setIsLeaveConfirmVisible(false);
                try {
                  await leaveChatRoom(parseInt(chatId as string));
                } catch (e) {
                  console.error('[Chat] 채팅방 나가기 실패:', e);
                }
                router.back();
              }}
            >
              <Text style={styles.dialogBtnConfirmText}>나가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ────────────────────────────────────────────────
  // List header (team status card + date divider)
  // ────────────────────────────────────────────────

  const renderListHeader = () => {
    if (!chat) return null;
    return (
      <View style={styles.listHeaderWrap}>
        {chat.detailType === 'group-status' && chat.teamInfo && (
          <View style={styles.teamCard}>
            <View style={styles.teamCardBadgeWrap}>
              <View style={styles.teamCardBadge}>
                <Text style={styles.teamCardBadgeText}>{chat.teamInfo.statusLabel}</Text>
              </View>
            </View>
            <Text style={styles.teamCardTitle}>{chat.teamInfo.title}</Text>
            <View style={styles.teamMemberRow}>
              {chat.teamInfo.members.map((member) => (
                <View key={member.id} style={styles.teamMemberItem}>
                  <View
                    style={[
                      styles.teamMemberAvatar,
                      member.filled ? styles.teamMemberAvatarFilled : styles.teamMemberAvatarEmpty,
                    ]}
                  >
                    <Text style={styles.teamMemberAvatarText}>{member.avatar}</Text>
                  </View>
                  <Text style={[styles.teamMemberName, !member.filled && styles.teamMemberNameEmpty]} numberOfLines={1}>{member.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.dateDivider}>
          <View style={styles.dateDividerPill}>
            <Text style={styles.dateDividerText}>오늘</Text>
          </View>
        </View>
      </View>
    );
  };

  // ────────────────────────────────────────────────
  // Action area (below message list)
  // ────────────────────────────────────────────────

  const renderActionArea = () => {
    if (!chat) return null;

    if (chat.detailType === 'member-invite') {
      const accepted = matchStatus === 'accepted';
      return (
        <View style={styles.actionArea}>
          <View style={[styles.actionBanner, accepted && styles.actionBannerDone]}>
            <Text style={[styles.actionBannerText, !accepted ? styles.actionBannerTextActive : styles.actionBannerTextDone]}>
              {accepted
                ? '🎉 팀 매칭이 완료됐어요! 팀채팅방에서 만나요.'
                : '💌 팀 매칭 제의가 왔어요! 수락하시겠어요?'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, accepted && styles.actionBtnDisabled]}
            disabled={accepted}
            onPress={handleMatchAction}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, accepted && styles.actionBtnTextDisabled]}>
              {accepted ? '팀 매칭 수락 완료' : '팀 매칭 수락하기'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (chat.detailType === 'leader-request') {
      const waiting = matchStatus === 'waiting';
      return (
        <View style={styles.actionArea}>
          <View style={[styles.actionBanner, waiting && styles.actionBannerDone]}>
            <Text style={[styles.actionBannerText, !waiting ? styles.actionBannerTextActive : styles.actionBannerTextDone]}>
              {waiting
                ? '💌 매칭 요청을 보냈어요. 상대방의 수락을 기다리는 중...'
                : '💌 팀 매칭 제안을 보내볼까요?'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, waiting && styles.actionBtnDisabled]}
            disabled={waiting}
            onPress={handleMatchAction}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, waiting && styles.actionBtnTextDisabled]}>
              {waiting ? '상대방 수락 대기 중' : '팀 매칭 제안하기'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>채팅을 불러올 수 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isGroup = chat.type === 'group';
  const headerName = isGroup ? `${chat.name} ${chat.avatar}` : chat.name;
  const headerSubtitle = isGroup && chat.teamInfo
    ? `${chat.teamInfo.currentCount}/${chat.teamInfo.totalCount}명 참여 중`
    : chat.description ?? null;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backBtnText}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerName}>{headerName}</Text>
          {headerSubtitle ? (
            <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => setIsMoreSheetVisible(true)} style={styles.moreBtn} hitSlop={8}>
          <Text style={styles.moreBtnText}>⋮</Text>
        </TouchableOpacity>
      </View>

      {renderMoreSheet()}
      {renderBlockConfirm()}
      {renderLeaveConfirm()}

      {/* 메시지 목록 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} showSenderName={isGroup} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messageListContent}
        ListHeaderComponent={renderListHeader}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      {renderActionArea()}

      {/* 메시지 입력 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <MessageInput onSendMessage={handleSendMessage} isLoading={isSending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: Colors.grayMedium,
  },

  // ── 헤더 ──────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  backBtn: {
    marginRight: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.grayMedium,
    fontWeight: '400',
  },
  moreBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreBtnText: {
    fontSize: 18,
    color: Colors.dark,
    includeFontPadding: false,
    marginTop: 3,
  },

  // ── 메시지 목록 ────────────────────────────────
  messageListContent: {
    paddingVertical: 8,
  },

  // ── 리스트 헤더 (팀 카드 + 날짜 구분선) ────────
  listHeaderWrap: {
    paddingBottom: 4,
  },
  teamCard: {
    backgroundColor: Colors.ogTint,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  teamCardBadgeWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  teamCardBadge: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  teamCardBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  teamCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 16,
  },
  teamMemberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamMemberItem: {
    alignItems: 'center',
    flex: 1,
  },
  teamMemberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamMemberAvatarFilled: {
    backgroundColor: Colors.white,
  },
  teamMemberAvatarEmpty: {
    backgroundColor: Colors.lightGray,
  },
  teamMemberAvatarText: {
    fontSize: 22,
  },
  teamMemberName: {
    fontSize: 11,
    color: Colors.dark,
    textAlign: 'center',
    maxWidth: 52,
  },
  teamMemberNameEmpty: {
    color: Colors.grayMedium,
  },
  dateDivider: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dateDividerPill: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  dateDividerText: {
    fontSize: 12,
    color: Colors.grayMedium,
  },

  // ── 액션 영역 ──────────────────────────────────
  actionArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: Colors.white,
    gap: 10,
  },
  actionBanner: {
    backgroundColor: Colors.ogTint,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  actionBannerText: {
    fontSize: 14,
    color: Colors.dark,
    fontWeight: '500',
  },
  actionBannerDone: {
    backgroundColor: Colors.pageBg,
  },
  actionBannerTextDone: {
    color: Colors.grayMedium,
  },
  actionBannerTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionBtnDisabled: {
    backgroundColor: Colors.lightGray,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  actionBtnTextDisabled: {
    color: Colors.grayMedium,
  },

  // ── 바텀 시트 ──────────────────────────────────
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  sheetItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetItemIconText: {
    fontSize: 18,
  },
  sheetItemLabel: {
    fontSize: 16,
    color: Colors.dark,
  },
  sheetItemDanger: {
    color: '#E53935',
  },
  sheetCloseBtn: {
    marginTop: 14,
    paddingVertical: 15,
    backgroundColor: Colors.pageBg,
    borderRadius: 14,
    alignItems: 'center',
  },
  sheetCloseBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },

  // ── 다이얼로그 ─────────────────────────────────
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  dialogBox: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 10,
  },
  dialogDesc: {
    fontSize: 14,
    color: Colors.grayMedium,
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogBtnCancel: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
  },
  dialogBtnCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  dialogBtnConfirm: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  dialogBtnConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
