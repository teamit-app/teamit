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
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { MessageBubble } from '../../../src/components/messages/MessageBubble';
import { MessageInput } from '../../../src/components/messages/MessageInput';
import { getChat, sendMessage, leaveChatRoom } from '../../../src/services/messageService';
import { Chat, Message } from '../../../src/types/message';
import { useReviewStore } from '../../../src/store/useReviewStore';
import { useInvitationStore } from '../../../src/store/useInvitationStore';
import { useReadStore } from '../../../src/store/useReadStore';

const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';

// ── 초대 관련 로컬 타입 ──────────────────────────────────────────────────────
interface InvitedUser {
  id: number;
  name: string;
  role: string;
  status: 'pending' | 'rejected';
  directChatId?: number;
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
// MY_USER_ID: mock 모드에서 "나"를 식별하는 ID. 실제 API 연동 시 auth 토큰에서 추출.
// amIRecruiter: teamInfo.members 중 내 ID(MY_USER_ID)가 isHost=true인지 여부.
//   - true  → 모집자 화면: 팀원 확정하기 버튼, 초대하기, 초대 대기 배너 표시
//   - false → 팀원 화면: 위 요소 모두 숨김
// 모집자 아바타 주황 테두리: isHost=true인 멤버에게 항상 적용 (모집자·팀원 화면 공통)
const MY_USER_ID = 1; // mock: 현재 로그인한 사용자 ID

export default function ChatDetailScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // 리뷰 완료 여부: 만료 채팅방에서 모든 팀원 리뷰를 제출했는지 확인
  const { getSubmittedReviews } = useReviewStore();
  const { addInvitationMessages, getExtraMessages } = useInvitationStore();
  const { markChatAsRead } = useReadStore();
  const reviewableCount = (chat?.teamInfo?.members ?? []).filter((m) => m.id !== MY_USER_ID).length;
  const allReviewsDone  = getSubmittedReviews(parseInt(chatId as string)).length >= reviewableCount;

  // 내가 이 채팅방의 모집자인지 여부 (팀 현황 UI 분기에 사용)
  const amIRecruiter =
    chat?.teamInfo?.members.find((m) => m.id === MY_USER_ID)?.isHost === true;

  // 팀 채팅 전용 상태
  const [isTeamConfirmed, setIsTeamConfirmed] = useState(false);
  const [isInviteSheetVisible, setIsInviteSheetVisible] = useState(false);
  const [isConfirmTeamModalVisible, setIsConfirmTeamModalVisible] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>(MOCK_INVITED);
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set([101, 102]));
  const [contactSearch, setContactSearch] = useState('');

  // 더보기 / 차단 / 나가기 / 이름 수정 모달
  const [isMoreSheetVisible, setIsMoreSheetVisible] = useState(false);
  const [isBlockConfirmVisible, setIsBlockConfirmVisible] = useState(false);
  const [isLeaveConfirmVisible, setIsLeaveConfirmVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameText, setRenameText] = useState('');

  useEffect(() => {
    loadChat();
  }, [chatId]);

  const loadChat = async () => {
    setIsLoading(true);
    try {
      const cid = parseInt(chatId as string);
      const data = await getChat(cid);
      if (data) {
        setChat(data);
        markChatAsRead(cid);
        // store에 동적으로 추가된 초대 메시지를 병합
        const extra = getExtraMessages(cid);
        setMessages([...data.messages, ...extra]);
        // 공모전 만료 상태이면 팀원이 이미 확정된 것으로 초기화
        if (data.teamInfo?.isExpired) setIsTeamConfirmed(true);
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
  const handleConfirmTeam = () => {
    setIsConfirmTeamModalVisible(false);
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
  const handleInvite = (contact: DirectContact) => {
    const newUser: InvitedUser = {
      id: contact.id,
      name: contact.name,
      role: contact.role,
      status: 'pending',
      directChatId: contact.chatId,
    };
    setInvitedUsers((prev) => [...prev, newUser]);
    setInvitedIds((prev) => new Set([...prev, contact.id]));

    // 1:1 채팅방에 초대 자동 메시지 추가
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

  // 초대 취소(X 버튼)
  const handleDismissInvite = (userId: number) => {
    setInvitedUsers((prev) => prev.filter((u) => u.id !== userId));
    setInvitedIds((prev) => { const s = new Set(prev); s.delete(userId); return s; });
  };

  // ── 더보기 / 차단 / 나가기 모달 ───────────────────────────────────────────

  const renderMoreSheet = () => (
    <Modal visible={isMoreSheetVisible} animationType="slide" transparent>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} onPress={() => setIsMoreSheetVisible(false)} />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          {chat?.type === 'group' && (
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
          <TouchableOpacity
            style={styles.sheetItem}
            onPress={() => { setIsMoreSheetVisible(false); setIsLeaveConfirmVisible(true); }}
          >
            <View style={styles.sheetItemIcon}><Text style={styles.sheetItemIconText}>🚪</Text></View>
            <Text style={[styles.sheetItemLabel, styles.sheetItemDanger]}>채팅방 나가기</Text>
          </TouchableOpacity>
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
    const filteredContacts = MOCK_CONTACTS.filter((c) =>
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
                          <TouchableOpacity onPress={() => handleDismissInvite(u.id)} hitSlop={8}>
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
                        ) : alreadyInvited ? (
                          <Text style={inviteSheet.invitedLabel}>초대 전송됨</Text>
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
                isHost=true 멤버: 주황 테두리 (모집자·팀원 화면 공통 적용) */}
            <View style={teamCard.memberRow}>
              {chat.teamInfo.members
                .filter((m) => m.filled)
                .map((m) => (
                  <View key={m.id} style={teamCard.memberItem}>
                    <View style={[teamCard.memberAvatar, m.isHost && teamCard.hostAvatar]}>
                      <Text style={teamCard.memberAvatarText}>{m.avatar}</Text>
                    </View>
                    <Text style={teamCard.memberName} numberOfLines={1}>{m.name}</Text>
                  </View>
                ))}

              {/* 초대하기 버튼 – 모집자만, 미확정 & 슬롯 남을 때 */}
              {amIRecruiter && !isTeamConfirmed &&
                chat.teamInfo.currentCount < chat.teamInfo.totalCount && (
                  <TouchableOpacity
                    style={teamCard.memberItem}
                    onPress={() => setIsInviteSheetVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={teamCard.inviteCircle}>
                      <Text style={teamCard.invitePlus}>+</Text>
                    </View>
                    <Text style={teamCard.inviteLabel}>초대하기</Text>
                  </TouchableOpacity>
                )}
            </View>

            {/* 팀원 확정하기 버튼 + 안내 문구 – 모집자만, 미확정 때 */}
            {amIRecruiter && !isTeamConfirmed && (
              <>
                <TouchableOpacity
                  style={teamCard.confirmBtn}
                  onPress={() => setIsConfirmTeamModalVisible(true)}
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
    if (!isTeamConfirmed) return null;
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
                    <Text style={styles.dDayText}>D-{dDay}</Text>
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
        {renderRenameModal()}
        {/* 팀원 초대 바텀시트·확정 모달은 모집자만 사용 가능 */}
        {amIRecruiter && renderConfirmTeamModal()}
        {amIRecruiter && renderInviteSheet()}

        {/* ── 메시지 목록 ── */}
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
