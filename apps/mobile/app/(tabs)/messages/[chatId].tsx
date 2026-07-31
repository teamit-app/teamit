import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { Alert } from '../../../src/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { MessageBubble } from '../../../src/components/messages/MessageBubble';
import { MessageInput } from '../../../src/components/messages/MessageInput';
import { getChat, sendMessage, leaveChatRoom, deleteChatRoom, getChatRooms, adaptMessage, markChatRoomAsRead } from '../../../src/services/messageService';
import { subscribeToChatRoom } from '../../../src/services/socket';
import { Chat, Message } from '../../../src/types/message';
import { useReviewStore } from '../../../src/store/useReviewStore';
import { useInvitationStore } from '../../../src/store/useInvitationStore';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { confirmTeam } from '../../../src/services/postService';
import { sendInvitation, getSentInvitations, cancelInvitation } from '../../../src/services/invitationService';
import { formatDDay } from '../../../src/utils/dday';
import { trackEvent } from '../../../src/services/gtm';

const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';

// ── 초대 관련 로컬 타입 ──────────────────────────────────────────────────────
interface InvitedUser {
  id: number;
  name: string;
  role: string;
  status: 'pending' | 'rejected';
  directChatId?: number;
  invitationId?: number;
}

interface DirectContact {
  id: number;
  chatId: number;
  name: string;
  avatar: string;
  role: string;
  isTeamMember: boolean;
}

// mock 전용 더미 데이터 (초대 시트) — 실제 더미 1:1 채팅방과 동일한 목록
const MOCK_INVITED: InvitedUser[] = [
  { id: 202, name: '박팀장', role: '팀 리더·기획', status: 'rejected' },
];

const MOCK_CONTACTS: DirectContact[] = [
  { id: 201, chatId: 3, name: '김모집',   avatar: '👑', role: '개발·AI',        isTeamMember: false },
  { id: 202, chatId: 4, name: '박팀장',   avatar: '🚀', role: '팀 리더·기획',   isTeamMember: false },
  { id: 203, chatId: 5, name: '이팀원',   avatar: '⭐', role: '개발·프론트엔드', isTeamMember: false },
  { id: 204, chatId: 6, name: '최기획자', avatar: '📋', role: '기획·프로덕트',  isTeamMember: false },
  { id: 205, chatId: 7, name: '김팀장',   avatar: '🏆', role: '팀 리더',        isTeamMember: false },
];

// ── 메인 화면 ─────────────────────────────────────────────────────────────────
// [모집자 vs 팀원 분기 로직]
// MY_USER_ID: 로그인된 사용자 ID (authStore에서 가져옴 — 탭 레이아웃 마운트 시 서버에서 재조회되어 새로고침에도 안전)
// amIRecruiter: teamInfo.members 중 내 ID(MY_USER_ID)가 isHost=true인지 여부.
//   - true  → 모집자 화면: 팀원 확정하기 버튼, 초대하기, 초대 대기 배너 표시
//   - false → 팀원 화면: 위 요소 모두 숨김
// 모집자 아바타 주황 테두리: isHost=true인 멤버에게 항상 적용 (모집자·팀원 화면 공통)

export default function ChatDetailScreen() {
  const MY_USER_ID = useAuthStore((state) => state.currentUserId) ?? 0;
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // 리뷰 완료 여부: 만료 채팅방에서 모든 팀원 리뷰를 제출했는지 확인
  const { loadSubmitted, getSubmittedReceiverIds } = useReviewStore();
  const { addInvitationMessages, getExtraMessages } = useInvitationStore();
  const reviewableCount = (chat?.teamInfo?.members ?? []).filter((m) => m.filled && m.id !== MY_USER_ID).length;
  const allReviewsDone  = getSubmittedReceiverIds(parseInt(chatId as string)).length >= reviewableCount;

  useEffect(() => {
    if (chatId) loadSubmitted(parseInt(chatId as string));
  }, [chatId]);

  // 내가 이 채팅방의 모집자인지 여부 (팀 현황 UI 분기에 사용)
  const amIRecruiter =
    chat?.teamInfo?.members.find((m) => m.id === MY_USER_ID)?.isHost === true;

  // 팀 채팅 전용 상태
  const [isTeamConfirmed, setIsTeamConfirmed] = useState(false);
  const [isInviteSheetVisible, setIsInviteSheetVisible] = useState(false);
  const [isConfirmTeamModalVisible, setIsConfirmTeamModalVisible] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>(IS_MOCK ? MOCK_INVITED : []);
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set(IS_MOCK ? [101, 102] : []));
  const [rejectedIds, setRejectedIds] = useState<Set<number>>(new Set());
  const [contacts, setContacts] = useState<DirectContact[]>(IS_MOCK ? MOCK_CONTACTS : []);
  const [contactSearch, setContactSearch] = useState('');

  // 더보기 / 차단 / 나가기 / 이름 수정 모달
  const [isMoreSheetVisible, setIsMoreSheetVisible] = useState(false);
  const [isBlockConfirmVisible, setIsBlockConfirmVisible] = useState(false);
  const [isLeaveConfirmVisible, setIsLeaveConfirmVisible] = useState(false);
  const [isDeleteRoomConfirmVisible, setIsDeleteRoomConfirmVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameText, setRenameText] = useState('');

  useEffect(() => {
    loadChat();
  }, [chatId]);

  // 이 채팅방을 열어둔 동안 실시간으로 새 메시지를 받는다. 내가 보낸 메시지는
  // handleSendMessage에서 이미 로컬에 append했는데 이 구독으로도 다시 돌아오므로,
  // 같은 messageId가 이미 있으면 무시해서 중복 표시를 막는다.
  useEffect(() => {
    if (IS_MOCK || !chatId) return;
    const cid = parseInt(chatId as string);
    const unsubscribe = subscribeToChatRoom(cid, (backendMessage) => {
      const adapted = adaptMessage(backendMessage, MY_USER_ID);
      setMessages((prev) => (prev.some((m) => m.id === adapted.id) ? prev : [...prev, adapted]));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      // 방을 열어둔 채로 새 메시지를 받는 것도 "읽은" 것으로 친다 — 안 그러면
      // 화면엔 이미 보이는데 채팅 목록에선 계속 안읽음으로 남는다
      markChatRoomAsRead(cid).catch((e) => console.error('[Chat] 읽음 처리 실패:', e));
    });
    return unsubscribe;
  }, [chatId, MY_USER_ID]);

  // 초대하기 시트용 데이터: 1:1 채팅 나눠본 상대 목록 + 이미 보낸 초대장 상태
  // (mock 모드는 MOCK_CONTACTS/MOCK_INVITED를 그대로 씀)
  useEffect(() => {
    if (IS_MOCK || !amIRecruiter || !chat?.postId) return;
    const postId = chat.postId;

    Promise.all([getChatRooms(), getSentInvitations(postId)])
      .then(([rooms, sent]) => {
        const teamMemberIds = new Set(
          (chat.teamInfo?.members ?? []).filter((m) => m.filled).map((m) => m.id),
        );
        const directChatIdByUserId = new Map(
          rooms
            .filter((r) => r.type === 'direct' && r.opponentUserId != null)
            .map((r) => [r.opponentUserId as number, r.id]),
        );

        const list: DirectContact[] = rooms
          .filter((r) => r.type === 'direct' && r.opponentUserId != null)
          .map((r) => ({
            id: r.opponentUserId as number,
            chatId: r.id,
            name: r.name,
            avatar: r.avatar,
            role: '',
            isTeamMember: teamMemberIds.has(r.opponentUserId as number),
          }));
        setContacts(list);

        setInvitedUsers(
          sent
            .filter((i) => i.status === 'PENDING' || i.status === 'REJECTED')
            .map((i) => ({
              id: i.receiverId,
              name: i.receiverNickname,
              role: '',
              status: i.status === 'PENDING' ? 'pending' : 'rejected',
              // 1:1 채팅을 나눠본 적 있어야 초대 가능하므로 항상 존재해야 하지만,
              // 방어적으로 없으면 "채팅하기" 버튼을 숨김
              directChatId: directChatIdByUserId.get(i.receiverId),
              invitationId: i.invitationId,
            })),
        );
        // 거절한 사용자에게는 재초대가 안 되므로(서버에서도 막힘), 대기 중 + 거절 둘 다 초대 버튼을 비활성화
        setInvitedIds(
          new Set(sent.filter((i) => i.status === 'PENDING' || i.status === 'REJECTED').map((i) => i.receiverId)),
        );
        setRejectedIds(new Set(sent.filter((i) => i.status === 'REJECTED').map((i) => i.receiverId)));
      })
      .catch(() => {});
  }, [amIRecruiter, chat?.postId]);

  const loadChat = async () => {
    setIsLoading(true);
    try {
      const cid = parseInt(chatId as string);
      const data = await getChat(cid);
      if (data) {
        setChat(data);
        markChatRoomAsRead(cid).catch((e) => console.error('[Chat] 읽음 처리 실패:', e));
        // store에 동적으로 추가된 초대 메시지를 병합
        const extra = getExtraMessages(cid);
        setMessages([...data.messages, ...extra]);
        // 모집자가 이미 팀원을 확정한 상태이면 복원 (isExpired는 공모전 마감 여부라 별개)
        if (data.teamInfo?.teamConfirmed) setIsTeamConfirmed(true);
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

  // 팀원 확정 처리
  const handleConfirmTeam = async () => {
    setIsConfirmTeamModalVisible(false);
    try {
      if (chat?.postId) {
        await confirmTeam(chat.postId);
      }
    } catch (e) {
      console.error('Failed to confirm team:', e);
      Alert.alert('팀 확정 실패', '팀을 확정하지 못했어요. 잠시 후 다시 시도해주세요.');
      return;
    }
    trackEvent('team_confirm', { post_id: chat?.postId ?? null });
    setIsTeamConfirmed(true);
    const systemMsg: Message = {
      id: Date.now(),
      senderId: 0,
      senderName: '',
      senderAvatar: '',
      content: '✅ 팀원을 확정했습니다',
      createdAt: new Date().toISOString(),
      isSent: false,
      isSystem: true,
    };
    setMessages((prev) => [...prev, systemMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // 초대 전송
  const handleInvite = async (contact: DirectContact) => {
    if (!IS_MOCK) {
      if (!chat?.postId) return;
      try {
        const res = await sendInvitation(chat.postId, contact.id);
        trackEvent('invite_sent', {
          post_id: chat.postId,
          target_user_id: contact.id,
          source: 'chat_room',
        });
        setInvitedUsers((prev) => [
          ...prev,
          {
            id: contact.id,
            name: contact.name,
            role: contact.role,
            status: 'pending',
            directChatId: contact.chatId,
            invitationId: res.invitationId,
          },
        ]);
        setInvitedIds((prev) => new Set([...prev, contact.id]));
      } catch (e) {
        console.error('[ChatDetail] 초대 실패:', e);
        Alert.alert('오류', '초대에 실패했어요. 다시 시도해주세요.');
      }
      return;
    }

    const newUser: InvitedUser = {
      id: contact.id,
      name: contact.name,
      role: contact.role,
      status: 'pending',
      directChatId: contact.chatId,
    };
    setInvitedUsers((prev) => [...prev, newUser]);
    setInvitedIds((prev) => new Set([...prev, contact.id]));
    trackEvent('invite_sent', {
      post_id: chat?.postId ?? null,
      target_user_id: contact.id,
      source: 'chat_room',
    });

    // 1:1 채팅방에 초대 자동 메시지 추가 (mock 전용)
    const now = new Date().toISOString();
    const baseId = Date.now();
    addInvitationMessages(contact.chatId, [
      {
        id: baseId,
        senderId: MY_USER_ID,
        senderName: '나',
        senderAvatar: '👨‍💻',
        content: `티밋님이 ${contact.name}님을 팀에 초대하셨어요! 🎉`,
        createdAt: now,
        isSent: true,
      },
      {
        id: baseId + 1,
        senderId: MY_USER_ID,
        senderName: '나',
        senderAvatar: '👨‍💻',
        content: '',
        createdAt: now,
        isSent: true,
        invitationCard: {
          title: chat?.name ? `${chat.name} 팀원 모집` : '팀원을 모집합니다',
          currentMembers: chat?.teamInfo?.currentCount ?? 0,
          totalMembers: chat?.teamInfo?.totalCount ?? 0,
          contestName: chat?.description ?? '공모전',
          senderName: '나',
          postId: 1,
          invitationId: 1,
        },
      },
    ]);
  };

  // 초대 취소(X 버튼) — 서버에 실제로 취소 반영해야 재입장해도 원복되지 않고,
  // 상대방도 "1:1 채팅 목록"에서 다시 초대 가능한 상태로 보임
  const handleDismissInvite = async (user: InvitedUser) => {
    if (!IS_MOCK) {
      if (!chat?.postId || !user.invitationId) return;
      try {
        await cancelInvitation(chat.postId, user.invitationId);
      } catch (e) {
        console.error('[ChatDetail] 초대 취소 실패:', e);
        Alert.alert('오류', '초대 취소에 실패했어요. 다시 시도해주세요.');
        return;
      }
    }
    trackEvent('invite_cancel', { post_id: chat?.postId ?? null, target_user_id: user.id });
    setInvitedUsers((prev) => prev.filter((u) => u.id !== user.id));
    setInvitedIds((prev) => { const s = new Set(prev); s.delete(user.id); return s; });
  };

  // ── 더보기 / 차단 / 나가기 모달 ───────────────────────────────────────────

  const renderMoreSheet = () => (
    <Modal visible={isMoreSheetVisible} animationType="slide" transparent>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} onPress={() => setIsMoreSheetVisible(false)} />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          {/* 채팅방 이름 수정하기 — 모집자(방장)만 가능 */}
          {chat?.type === 'group' && amIRecruiter && (
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setIsMoreSheetVisible(false);
                setRenameText(chat?.name ?? '');
                setIsRenameModalVisible(true);
              }}
            >
              <View style={styles.sheetItemIcon}><Text style={styles.sheetItemIconText}>✏️</Text></View>
              <Text style={styles.sheetItemLabel}>채팅방 이름 수정하기</Text>
            </TouchableOpacity>
          )}
          {chat?.type === 'direct' && (
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setIsMoreSheetVisible(false);
                if (IS_MOCK) {
                  setIsBlockConfirmVisible(true);
                } else {
                  Alert.alert('개발 중', '차단 기능은 현재 개발 중입니다.');
                }
              }}
            >
              <View style={styles.sheetItemIcon}><Text style={styles.sheetItemIconText}>🚫</Text></View>
              <Text style={styles.sheetItemLabel}>차단하기</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.sheetItem}
            onPress={() => {
              setIsMoreSheetVisible(false);
              if (IS_MOCK) {
                router.push(`/messages/${chatId}/report` as never);
              } else {
                Alert.alert('개발 중', '신고 기능은 현재 개발 중입니다.');
              }
            }}
          >
            <View style={styles.sheetItemIcon}><Text style={styles.sheetItemIconText}>⚠️</Text></View>
            <Text style={styles.sheetItemLabel}>신고하기</Text>
          </TouchableOpacity>
          {/* 채팅방 나가기 — 1:1은 아예 나갈 수 없고(상대 정보·메시지 보존을 위해),
              그룹은 모집자(방장) 제외 팀원만 나갈 수 있다(방장은 나가기 대신 삭제하기만 사용) */}
          {chat?.type === 'group' && !amIRecruiter && (
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => { setIsMoreSheetVisible(false); setIsLeaveConfirmVisible(true); }}
            >
              <View style={styles.sheetItemIcon}><Text style={styles.sheetItemIconText}>🚪</Text></View>
              <Text style={[styles.sheetItemLabel, styles.sheetItemDanger]}>채팅방 나가기</Text>
            </TouchableOpacity>
          )}
          {/* 채팅방 삭제하기 — 모집자(방장)만 가능, 모집글도 함께 삭제됨 */}
          {amIRecruiter && chat?.type === 'group' && (
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => { setIsMoreSheetVisible(false); setIsDeleteRoomConfirmVisible(true); }}
            >
              <View style={styles.sheetItemIcon}><Text style={styles.sheetItemIconText}>🗑️</Text></View>
              <Text style={[styles.sheetItemLabel, styles.sheetItemDanger]}>채팅방 삭제하기</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setIsMoreSheetVisible(false)}>
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
            <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setIsBlockConfirmVisible(false)}>
              <Text style={styles.dialogBtnCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialogBtnConfirm}
              onPress={() => { setIsBlockConfirmVisible(false); setTimeout(() => router.back(), 300); }}
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
            <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setIsLeaveConfirmVisible(false)}>
              <Text style={styles.dialogBtnCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialogBtnConfirm}
              onPress={async () => {
                setIsLeaveConfirmVisible(false);
                try { await leaveChatRoom(parseInt(chatId as string)); } catch {}
                // API 실패해도 UX상 항상 나가짐 처리되므로(위 catch 참고) 이벤트도 동일하게 보낸다
                trackEvent('chat_leave', { chat_id: parseInt(chatId as string) });
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

  // 채팅방 삭제 확인 (모집자 전용) — 모집글도 함께 삭제되고 팀원·지원자에게 알림이 감
  const renderDeleteRoomConfirm = () => (
    <Modal visible={isDeleteRoomConfirmVisible} animationType="fade" transparent>
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogBox}>
          <Text style={styles.dialogTitle}>채팅방을 삭제할까요?</Text>
          <Text style={styles.dialogDesc}>
            {'채팅방을 삭제하면 연결된 모집글도 함께 삭제돼요.\n팀원과 지원자 전원에게 삭제 알림이 가고,\n이 작업은 되돌릴 수 없어요.\n삭제하시겠어요?'}
          </Text>
          <View style={styles.dialogBtns}>
            <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setIsDeleteRoomConfirmVisible(false)}>
              <Text style={styles.dialogBtnCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialogBtnConfirm}
              onPress={async () => {
                setIsDeleteRoomConfirmVisible(false);
                try {
                  await deleteChatRoom(parseInt(chatId as string));
                  trackEvent('chat_delete', { chat_id: parseInt(chatId as string) });
                  router.back();
                } catch (e) {
                  console.error('[ChatDetail] 채팅방 삭제 실패:', e);
                  Alert.alert('오류', '삭제에 실패했어요. 다시 시도해주세요.');
                }
              }}
            >
              <Text style={styles.dialogBtnConfirmText}>삭제하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── 채팅방 이름 수정 팝업 ────────────────────────────────────────────────
  const renderRenameModal = () => (
    <Modal visible={isRenameModalVisible} animationType="fade" transparent>
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogBox}>
          <View style={styles.renameTitleRow}>
            <Text style={styles.dialogTitle}>채팅방 이름 수정</Text>
            <Text style={styles.renameCount}>{renameText.length}/30</Text>
          </View>
          <TextInput
            style={styles.renameInput}
            value={renameText}
            onChangeText={(t) => setRenameText(t.slice(0, 30))}
            placeholder=""
            placeholderTextColor={Colors.grayLight}
            autoFocus
          />
          <View style={styles.dialogBtns}>
            <TouchableOpacity
              style={styles.dialogBtnCancel}
              onPress={() => setIsRenameModalVisible(false)}
            >
              <Text style={styles.dialogBtnCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialogBtnConfirm}
              onPress={() => {
                if (chat && renameText.trim()) {
                  setChat((prev) => prev ? { ...prev, name: renameText.trim() } : prev);
                }
                setIsRenameModalVisible(false);
              }}
            >
              <Text style={styles.dialogBtnConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── 팀원 확정 확인 팝업 ──────────────────────────────────────────────────
  const renderConfirmTeamModal = () => (
    <Modal visible={isConfirmTeamModalVisible} animationType="fade" transparent>
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogBox}>
          <Text style={styles.dialogTitle}>팀원을 확정하시겠습니까?</Text>
          <Text style={styles.dialogDesc}>
            팀원을 확정하시면 모집글이 마감되고, 팀 매칭이 완료되어 더 이상 팀원을 추가할 수 없게 됩니다.
          </Text>
          <View style={styles.dialogBtns}>
            <TouchableOpacity
              style={styles.dialogBtnCancel}
              onPress={() => setIsConfirmTeamModalVisible(false)}
            >
              <Text style={styles.dialogBtnCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dialogBtnConfirm} onPress={handleConfirmTeam}>
              <Text style={styles.dialogBtnConfirmText}>확정하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── 초대하기 바텀시트 ─────────────────────────────────────────────────────
  const renderInviteSheet = () => {
    if (!chat?.teamInfo) return null;
    const remainingSlots = chat.teamInfo.totalCount - chat.teamInfo.currentCount;
    const filteredContacts = contacts.filter((c) =>
      c.name.includes(contactSearch) || c.role.includes(contactSearch),
    );

    return (
      <Modal visible={isInviteSheetVisible} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} onPress={() => setIsInviteSheetVisible(false)} />
          <View style={[styles.sheetContainer, inviteSheet.container]}>
            <View style={styles.sheetHandle} />

            {/* 시트 헤더 */}
            <View style={inviteSheet.header}>
              <Text style={inviteSheet.title}>팀원 초대</Text>
              <TouchableOpacity
                style={inviteSheet.closeBtnWrap}
                onPress={() => setIsInviteSheetVisible(false)}
                hitSlop={8}
              >
                <Text style={inviteSheet.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 초대 상태 */}
              {invitedUsers.length > 0 && (
                <View style={inviteSheet.section}>
                  <Text style={inviteSheet.sectionTitle}>초대 상태</Text>
                  {invitedUsers.map((u) => (
                    <View
                      key={u.id}
                      style={[
                        inviteSheet.invitedCard,
                        u.status === 'pending' ? inviteSheet.invitedCardPending : inviteSheet.invitedCardRejected,
                      ]}
                    >
                      <View style={inviteSheet.invitedAvatar}>
                        <Text style={inviteSheet.invitedAvatarText}>👤</Text>
                      </View>
                      <View style={inviteSheet.invitedInfo}>
                        <Text style={inviteSheet.invitedName}>{u.name}</Text>
                        <Text style={inviteSheet.invitedRole}>{u.role}</Text>
                      </View>
                      {u.status === 'pending' ? (
                        <View style={inviteSheet.pendingRight}>
                          <View style={inviteSheet.pendingBadge}>
                            <Text style={inviteSheet.pendingBadgeText}>⏳ 수락 대기 중</Text>
                          </View>
                          <TouchableOpacity
                            style={inviteSheet.chatBtn}
                            onPress={() => {
                              setIsInviteSheetVisible(false);
                              if (u.directChatId) router.push(`/messages/${u.directChatId}` as never);
                            }}
                          >
                            <Text style={inviteSheet.chatBtnText}>채팅하기</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDismissInvite(u)} hitSlop={8}>
                            <Text style={inviteSheet.dismissBtn}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={inviteSheet.rejectedBadge}>
                          <Text style={inviteSheet.rejectedBadgeText}>거절됨</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* 1:1 채팅 목록 */}
              <View style={inviteSheet.section}>
                <View style={inviteSheet.sectionTitleRow}>
                  <Text style={inviteSheet.sectionTitle}>1:1 채팅 목록</Text>
                  <Text style={inviteSheet.remainingText}>잔여 {remainingSlots}자리</Text>
                </View>

                {/* 검색 */}
                <View style={inviteSheet.searchRow}>
                  <Text style={inviteSheet.searchIcon}>🔍</Text>
                  <TextInput
                    style={inviteSheet.searchInput}
                    placeholder="닉네임으로 검색"
                    placeholderTextColor={Colors.grayLight}
                    value={contactSearch}
                    onChangeText={setContactSearch}
                  />
                </View>

                <View style={inviteSheet.contactList}>
                  {filteredContacts.map((c) => {
                    const alreadyInvited = invitedIds.has(c.id);
                    const isRejected = rejectedIds.has(c.id);
                    const isDone = alreadyInvited || c.isTeamMember;
                    return (
                      <View key={c.id} style={[inviteSheet.contactRow, isDone && inviteSheet.contactRowDone]}>
                        <View style={[inviteSheet.contactAvatar, isDone && inviteSheet.contactAvatarDone]}>
                          <Text style={inviteSheet.contactAvatarText}>{c.avatar}</Text>
                        </View>
                        <View style={inviteSheet.contactInfo}>
                          <Text style={inviteSheet.contactName}>{c.name}</Text>
                          <Text style={inviteSheet.contactRole}>{c.role}</Text>
                        </View>
                        {c.isTeamMember ? (
                          <View style={inviteSheet.teamMemberPill}>
                            <Text style={inviteSheet.teamMemberPillText}>팀원 추가 완료</Text>
                          </View>
                        ) : isRejected ? (
                          <Text style={inviteSheet.invitedLabel}>거절됨</Text>
                        ) : alreadyInvited ? (
                          <Text style={inviteSheet.invitedLabel}>초대 전송됨</Text>
                        ) : isExpired ? (
                          <Text style={inviteSheet.invitedLabel}>마감</Text>
                        ) : (
                          <TouchableOpacity
                            style={inviteSheet.inviteBtn}
                            onPress={() => handleInvite(c)}
                            activeOpacity={0.8}
                          >
                            <Text style={inviteSheet.inviteBtnText}>초대</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ── 리스트 헤더 (팀 현황 + 날짜 구분선) ──────────────────────────────────
  const renderListHeader = () => {
    if (!chat) return null;

    return (
      <View style={styles.listHeaderWrap}>
        {/* 어느 공모전에 대한 팀 채팅방인지 알 수 있는 모집글 배너 — 탭하면 모집글 상세로 */}
        {chat.type === 'group' && chat.postId && chat.teamInfo?.postTitle && (
          <TouchableOpacity
            style={postBanner.wrap}
            activeOpacity={0.8}
            onPress={() =>
              router.push(`/messages/post/${chat.postId}?contestId=${chat.teamInfo?.contestId ?? ''}` as never)
            }
          >
            <View style={postBanner.iconCircle}>
              <Text style={postBanner.icon}>🏆</Text>
            </View>
            <View style={postBanner.textWrap}>
              <Text style={postBanner.title} numberOfLines={1}>{chat.teamInfo.postTitle}</Text>
              {!!chat.teamInfo.contestTitle && (
                <Text style={postBanner.subtitle} numberOfLines={1}>{chat.teamInfo.contestTitle}</Text>
              )}
            </View>
            <Text style={postBanner.chevron}>›</Text>
          </TouchableOpacity>
        )}

        {chat.type === 'group' && chat.teamInfo && (
          <View style={teamCard.wrap}>
            {/* ── 상단 배너 ──────────────────────────────────────────────────
                팀 확정 후: 완료 배너 (모집자·팀원 공통)
                팀 확정 전 + 모집자: 초대 대기 배너 (클릭 시 초대 바텀시트)
                팀 확정 전 + 팀원:   배너 없음
            ─────────────────────────────────────────────────────────────── */}
            {isTeamConfirmed ? (
              <View style={teamCard.completeBanner}>
                <Text style={teamCard.completeBannerText}>🎉 팀 매칭이 완료되었습니다! 🎉</Text>
              </View>
            ) : amIRecruiter ? (
              (() => {
                const pendingCount = invitedUsers.filter((u) => u.status === 'pending').length;
                return pendingCount > 0 ? (
                  <TouchableOpacity
                    style={teamCard.pendingBanner}
                    onPress={() => setIsInviteSheetVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={teamCard.pendingBannerText}>
                      {pendingCount}명의 초대 수락을 기다리는 중..
                    </Text>
                  </TouchableOpacity>
                ) : null;
              })()
            ) : null}

            {/* 팀 현황 타이틀 */}
            <Text style={teamCard.title}>팀 현황</Text>

            {/* 팀원 아바타 행
                isHost=true 멤버: 주황 테두리 (모집자·팀원 화면 공통 적용)
                빈 자리는 모집 인원수만큼 그대로 표시 — 모집자면 각각 탭해서 초대 가능,
                아니면 "모집중" 표시만 (하드코딩된 슬롯 1개로 뭉치지 않도록 주의)
                팀이 확정된 이후에는 더 이상 모집하지 않으므로 빈 자리 자체를 표시하지 않음 */}
            <View style={teamCard.memberRow}>
              {chat.teamInfo.members.map((m, idx) =>
                m.filled ? (
                  <View key={m.id ?? `filled-${idx}`} style={teamCard.memberItem}>
                    <View style={[teamCard.memberAvatar, m.isHost && teamCard.hostAvatar]}>
                      <Text style={teamCard.memberAvatarText}>{m.avatar}</Text>
                    </View>
                    <Text style={teamCard.memberName} numberOfLines={1}>{m.name}</Text>
                  </View>
                ) : isTeamConfirmed ? null : amIRecruiter && !isExpired ? (
                  <TouchableOpacity
                    key={`invite-${idx}`}
                    style={teamCard.memberItem}
                    onPress={() => setIsInviteSheetVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={teamCard.inviteCircle}>
                      <Text style={teamCard.invitePlus}>+</Text>
                    </View>
                    <Text style={teamCard.inviteLabel}>초대하기</Text>
                  </TouchableOpacity>
                ) : (
                  <View key={`recruiting-${idx}`} style={teamCard.memberItem}>
                    <View style={teamCard.recruitingCircle}>
                      <Text style={teamCard.recruitingPlus}>+</Text>
                    </View>
                    <Text style={teamCard.inviteLabel}>{isExpired ? '마감' : '모집중'}</Text>
                  </View>
                ),
              )}
            </View>

            {/* 팀원 확정하기 버튼 + 안내 문구 – 모집자만, 미확정 때 */}
            {amIRecruiter && !isTeamConfirmed && (
              <>
                <TouchableOpacity
                  style={teamCard.confirmBtn}
                  onPress={() => {
                    if (reviewableCount === 0) {
                      Alert.alert(
                        '팀원 확정 불가',
                        '아직 합류한 팀원이 없어요. 팀원이 최소 1명 이상 있어야 팀을 확정할 수 있어요.',
                      );
                      return;
                    }
                    setIsConfirmTeamModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={teamCard.confirmBtnText}>팀원 확정하기</Text>
                </TouchableOpacity>
                <Text style={teamCard.confirmHint}>팀원을 확정해야 공모전 마감 후 팀원 리뷰를 작성할 수 있어요!</Text>
              </>
            )}
          </View>
        )}

        {/* 날짜 구분선 */}
        <View style={styles.dateDivider}>
          <View style={styles.dateDividerPill}>
            <Text style={styles.dateDividerText}>오늘</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── 리뷰 배너 (공모전 기한 전: 안내 / 기한 후: 리뷰 작성 유도) ─────────────
  const isExpired = chat?.teamInfo?.isExpired === true;
  const renderReviewBanner = () => {
    if (chat?.type !== 'group') return null;
    if (!isTeamConfirmed) return null;

    // 공모전 기한 만료 → 리뷰 작성 유도 배너 (클릭 가능)
    if (isExpired) {
      return (
        <TouchableOpacity
          style={[reviewBanner.wrap, reviewBanner.expiredWrap]}
          activeOpacity={0.85}
          onPress={() =>
            router.push(
              allReviewsDone
                ? { pathname: '/(tabs)/messages/review-complete' as never, params: { chatId: chat.id.toString() } }
                : { pathname: '/(tabs)/messages/review-write'   as never, params: { chatId: chat.id.toString() } }
            )
          }
        >
          <Text style={reviewBanner.icon}>✍️</Text>
          <View style={reviewBanner.textWrap}>
            <Text style={[reviewBanner.bold, reviewBanner.expiredBold]}>
              팀원 리뷰를 작성해 주세요!
            </Text>
            <Text style={reviewBanner.body}>
              공모전이 마감되었어요. 함께한 팀원을 리뷰하고 내가 받은 리뷰도 확인해 보세요.
            </Text>
          </View>
          <Text style={reviewBanner.chevron}>›</Text>
        </TouchableOpacity>
      );
    }

    // 팀원 확정 후, 아직 기한 전 → 사전 안내 배너
    return (
      <View style={reviewBanner.wrap}>
        <Text style={reviewBanner.icon}>💡</Text>
        <View style={reviewBanner.textWrap}>
          <Text style={reviewBanner.bold}>공모전 마감 후 팀원 간 상호 리뷰가 진행돼요!</Text>
          <Text style={reviewBanner.body}>
            공모전이 마무리되면 티밋에 돌아와 함께한 팀원을 리뷰해주세요.{' '}
            여러분의 한 줄 리뷰가 다음 팀원의 좋은 만남을 만듭니다.
          </Text>
        </View>
      </View>
    );
  };

  // ── 로딩 / 에러 ──────────────────────────────────────────────────────────
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

  // ── 헤더 데이터 ──────────────────────────────────────────────────────────
  const isGroup = chat.type === 'group';
  const confirmedCount = isTeamConfirmed && chat.teamInfo
    ? chat.teamInfo.currentCount
    : chat.teamInfo?.currentCount;
  const totalCount = chat.teamInfo?.totalCount;

  const headerName = isGroup ? `${chat.name} ${chat.avatar}` : chat.name;
  const headerSubtitle = isGroup && chat.teamInfo
    ? isTeamConfirmed
      ? `${confirmedCount}/${confirmedCount}명`
      : `${confirmedCount}/${totalCount}명 참여 중`
    : null;
  const dDay = isGroup ? chat.teamInfo?.dDay : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* ── 헤더 ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backBtnText}>{'<'}</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerName}>{headerName}</Text>
            {headerSubtitle ? (
              <View style={styles.headerSubtitleRow}>
                <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
                {dDay !== undefined && (
                  <View style={styles.dDayBadge}>
                    <Text style={styles.dDayText}>{formatDDay(dDay)}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => setIsMoreSheetVisible(true)} style={styles.moreBtn} hitSlop={8}>
            <Text style={styles.moreBtnText}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* 모달들 */}
        {renderMoreSheet()}
        {renderBlockConfirm()}
        {renderLeaveConfirm()}
        {renderDeleteRoomConfirm()}
        {renderRenameModal()}
        {/* 팀원 초대 바텀시트·확정 모달은 모집자만 사용 가능 */}
        {amIRecruiter && renderConfirmTeamModal()}
        {amIRecruiter && renderInviteSheet()}

        {/* ── 메시지 목록 ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              showSenderName={isGroup}
              onPressAvatar={(senderId) =>
                router.push(`/messages/talent/${senderId}` as never)
              }
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messageListContent}
          ListHeaderComponent={renderListHeader}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />

        {/* ── 리뷰 배너 (확정 후) ── */}
        {renderReviewBanner()}

        {/* ── 메시지 입력 ── */}
        <MessageInput onSendMessage={handleSendMessage} isLoading={isSending} />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 15, color: Colors.grayMedium },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  backBtn: { marginRight: 8, paddingVertical: 4, paddingHorizontal: 4 },
  backBtnText: { fontSize: 20, color: Colors.primary, fontWeight: '600' },
  headerTitleRow: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  headerSubtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  headerSubtitle: { fontSize: 11, color: Colors.grayMedium },
  dDayBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dDayText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  moreBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.pageBg,
    justifyContent: 'center', alignItems: 'center',
  },
  moreBtnText: { fontSize: 18, color: Colors.dark, includeFontPadding: false, marginTop: 3 },

  // 메시지 목록
  messageListContent: { paddingVertical: 8 },

  // 리스트 헤더
  listHeaderWrap: { paddingBottom: 4 },
  dateDivider: { alignItems: 'center', marginVertical: 14 },
  dateDividerPill: {
    backgroundColor: Colors.white, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.lightGray,
  },
  dateDividerText: { fontSize: 12, color: Colors.grayMedium },

  // 더보기 바텀시트
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheetBackdrop: { flex: 1 },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 10, paddingBottom: 28, paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: Colors.lightGray,
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, gap: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.lightGray,
  },
  sheetItemIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.pageBg, justifyContent: 'center', alignItems: 'center',
  },
  sheetItemIconText: { fontSize: 18 },
  sheetItemLabel: { fontSize: 16, color: Colors.dark },
  sheetItemDanger: { color: '#E53935' },
  sheetCloseBtn: {
    marginTop: 14, paddingVertical: 15,
    backgroundColor: Colors.pageBg, borderRadius: 14, alignItems: 'center',
  },
  sheetCloseBtnText: { fontSize: 16, fontWeight: '700', color: Colors.dark },

  // 공통 다이얼로그
  dialogOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28,
  },
  dialogBox: { width: '100%', backgroundColor: Colors.white, borderRadius: 20, padding: 24 },
  dialogTitle: { fontSize: 18, fontWeight: '700', color: Colors.dark, marginBottom: 10 },
  dialogDesc: { fontSize: 14, color: Colors.grayMedium, lineHeight: 22, marginBottom: 24 },
  dialogBtns: { flexDirection: 'row', gap: 10 },
  dialogBtnCancel: {
    flex: 1, paddingVertical: 18, borderRadius: 14,
    backgroundColor: Colors.pageBg, alignItems: 'center',
  },
  dialogBtnCancelText: { fontSize: 15, fontWeight: '700', color: Colors.grayMedium },
  dialogBtnConfirm: {
    flex: 1, paddingVertical: 18, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  dialogBtnConfirmText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  renameTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  renameCount: { fontSize: 13, color: Colors.grayMedium },
  renameInput: {
    backgroundColor: Colors.pageBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.dark,
    marginBottom: 20,
  },
});

// ── 팀 현황 카드 스타일 ────────────────────────────────────────────────────────
// ── 모집글 배너 스타일 ─────────────────────────────────────────────────────────
const postBanner = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  subtitle: { fontSize: 11, color: Colors.grayMedium, marginTop: 1 },
  chevron: { fontSize: 20, color: Colors.grayMedium },
});

const teamCard = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.ogTint,
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  // 초대 대기 배너
  pendingBanner: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  pendingBannerText: { fontSize: 13, color: Colors.grayMedium },
  // 완료 배너
  completeBanner: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.white
  },
  completeBannerText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  title: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 14 },

  memberRow: { flexDirection: 'row', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  memberItem: { alignItems: 'center', width: 56 },
  memberAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  hostAvatar: { borderWidth: 2, borderColor: Colors.primary },
  memberAvatarText: { fontSize: 24 },
  memberName: { fontSize: 11, color: Colors.dark, textAlign: 'center' },

  // 초대하기 슬롯
  inviteCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.lightGray,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  invitePlus: { fontSize: 22, color: Colors.white, fontWeight: '300' },
  inviteLabel: { fontSize: 11, color: Colors.grayMedium, textAlign: 'center' },

  // 모집중 슬롯 (팀원 시점 — 탭 불가)
  recruitingCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1.5, borderColor: Colors.lightGray, borderStyle: 'dashed',
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  recruitingPlus: { fontSize: 22, color: Colors.grayLight, fontWeight: '300' },

  // 팀원 확정하기 버튼
  confirmBtn: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignSelf: 'center',
    backgroundColor: Colors.white,
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  confirmHint: { fontSize: 11, color: Colors.grayMedium, textAlign: 'center', marginTop: 8 },
});

// ── 초대 바텀시트 스타일 ──────────────────────────────────────────────────────
const inviteSheet = StyleSheet.create({
  container: { maxHeight: '85%', paddingHorizontal: 0 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingBottom: 14, position: 'relative',
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.dark },
  closeBtnWrap: { position: 'absolute', right: 20 },
  closeBtn: { fontSize: 18, color: Colors.grayMedium },

  section: { paddingHorizontal: 20, marginBottom: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 12 },
  remainingText: { fontSize: 13, color: Colors.grayMedium },

  // 초대된 사용자 카드
  invitedCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 14, marginBottom: 8, gap: 10,
  },
  invitedCardPending: { borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.white },
  invitedCardRejected: { backgroundColor: Colors.pageBg },
  invitedAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center',
  },
  invitedAvatarText: { fontSize: 20 },
  invitedInfo: { flex: 1 },
  invitedName: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  invitedRole: { fontSize: 12, color: Colors.grayMedium, marginTop: 2 },

  pendingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.ogTint, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  pendingBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  chatBtn: {
    backgroundColor: Colors.primary, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chatBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  dismissBtn: { fontSize: 16, color: Colors.grayLight },

  rejectedBadge: {
    backgroundColor: Colors.pageBg, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  rejectedBadgeText: { fontSize: 12, color: Colors.grayMedium, fontWeight: '600' },

  // 검색
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.pageBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10, gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.dark },

  // 1:1 연락처 행
  contactList: { gap: 10 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  contactRowDone: { backgroundColor: Colors.pageBg },
  contactAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.ogTint, alignItems: 'center', justifyContent: 'center',
  },
  contactAvatarDone: { backgroundColor: Colors.pageBg },
  contactAvatarText: { fontSize: 22 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  contactRole: { fontSize: 12, color: Colors.grayMedium, marginTop: 2 },
  teamMemberPill: {
    backgroundColor: Colors.lightGray, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  teamMemberPillText: { fontSize: 12, color: Colors.grayMedium, fontWeight: '500' },
  invitedLabel: { fontSize: 12, color: Colors.grayMedium },
  inviteBtn: {
    backgroundColor: Colors.primary, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7, alignItems: 'center',
  },
  inviteBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
});

// ── 리뷰 배너 스타일 ──────────────────────────────────────────────────────────
const reviewBanner = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  expiredWrap: {
    backgroundColor: '#FFF2EB',
    borderColor: Colors.primary,
  },
  icon: { fontSize: 18 },
  textWrap: { flex: 1, gap: 4 },
  bold: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  expiredBold: { color: Colors.primary },
  body: { fontSize: 12, color: Colors.grayMedium, lineHeight: 18 },
  chevron: { fontSize: 20, color: Colors.primary, fontWeight: '300' },
});
