import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { MessageBubble } from '../../../src/components/messages/MessageBubble';
import { MessageInput } from '../../../src/components/messages/MessageInput';
import { getChat, sendMessage } from '../../../src/services/messageService';
import { Chat, Message } from '../../../src/types/message';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [matchStatus, setMatchStatus] = useState<
    'pending' | 'accepted' | 'requested' | 'waiting' | 'completed' | 'none'
  >('none');

  useEffect(() => {
    loadChat();
  }, [chatId]);

  const loadChat = async () => {
    setIsLoading(true);
    try {
      const chatData = await getChat(parseInt(chatId as string));
      if (chatData) {
        setChat(chatData);
        setMessages(chatData.messages);
        setMatchStatus(chatData.matchStatus ?? 'none');
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    setIsSending(true);
    try {
      const newMessage = await sendMessage(parseInt(chatId as string), text);
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleMoreOptions = () => {
    // TODO: Bottom sheet 구현
    console.log('More options pressed');
  };

  const handleMatchAction = () => {
    if (chat?.detailType === 'member-invite') {
      setMatchStatus('accepted');
      return;
    }
    if (chat?.detailType === 'leader-request') {
      setMatchStatus('waiting');
      return;
    }
  };

  const renderActionArea = () => {
    if (!chat) return null;

    if (chat.detailType === 'member-invite') {
      const accepted = matchStatus === 'accepted';
      return (
        <View style={styles.actionArea}>
          <View style={styles.actionInfoBox}>
            <Text style={styles.actionTitle}>팀 매칭 제안이 왔어요!</Text>
            <Text style={styles.actionDescription}>
              이 팀과 매칭을 수락하면 채팅으로 바로 대화를 이어갈 수 있어요.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.actionButton,
              accepted ? styles.disabledButton : styles.primaryButton,
            ]}
            disabled={accepted}
            onPress={handleMatchAction}
          >
            <Text style={[styles.actionButtonText, accepted && styles.disabledButtonText]}>
              {accepted ? '매칭 수락 완료' : '매칭 수락하기'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (chat.detailType === 'leader-request') {
      const waiting = matchStatus === 'waiting';
      return (
        <View style={styles.actionArea}>
          <View style={styles.actionInfoBox}>
            <Text style={styles.actionTitle}>팀 매칭 요청을 보냈습니다</Text>
            <Text style={styles.actionDescription}>
              요청을 보내면 상대방의 수락 여부를 기다리는 중이에요.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.actionButton,
              waiting ? styles.disabledButton : styles.primaryButton,
            ]}
            disabled={waiting}
            onPress={handleMatchAction}
          >
            <Text style={[styles.actionButtonText, waiting && styles.disabledButtonText]}>
              {waiting ? '수락 대기 중' : '매칭 요청하기'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const renderListHeader = () => {
    if (!chat) return null;

    return (
      <View style={styles.listHeaderContainer}>
        {chat.detailType === 'group-status' && chat.teamInfo && (
          <View style={styles.teamStatusCard}>
            <View style={styles.teamStatusBadge}>
              <Text style={styles.teamStatusBadgeText}>{chat.teamInfo.statusLabel}</Text>
            </View>
            <View style={styles.teamStatusHeaderRow}>
              <Text style={styles.teamStatusTitle}>{chat.teamInfo.title}</Text>
              <Text style={styles.teamStatusParticipants}>
                {chat.teamInfo.currentCount}/{chat.teamInfo.totalCount}명 참여 중
              </Text>
            </View>
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
                  <Text style={styles.teamMemberName}>{member.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>오늘</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>채팅을 불러올 수 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.chatName}>{chat.name}</Text>
          {chat.type === 'group' && (
            <Text style={styles.chatType}>
              {chat.participants.length}명
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleMoreOptions} style={styles.moreButton}>
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* 메시지 목록 */}
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={true}
        contentContainerStyle={styles.messageListContent}
        ListHeaderComponent={renderListHeader}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  chatType: {
    fontSize: 11,
    color: Colors.grayMedium,
    marginTop: 2,
  },
  moreButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreButtonText: {
    fontSize: 20,
    color: Colors.dark,
  },
  listHeaderContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  todayBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 8,
  },
  todayBadgeText: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
  teamStatusCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  teamStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  teamStatusBadgeText: {
    color: Colors.primary,
    fontSize: 12,
  },
  teamStatusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  teamStatusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  teamStatusParticipants: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
  teamMemberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamMemberItem: {
    alignItems: 'center',
    width: 56,
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
    backgroundColor: Colors.primary,
  },
  teamMemberAvatarEmpty: {
    backgroundColor: Colors.backgroundLight,
  },
  teamMemberAvatarText: {
    fontSize: 20,
  },
  teamMemberName: {
    fontSize: 11,
    color: Colors.dark,
    textAlign: 'center',
  },
  actionArea: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  actionInfoBox: {
    backgroundColor: Colors.backgroundLight,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 13,
    color: Colors.grayMedium,
    lineHeight: 19,
  },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    backgroundColor: Colors.lightGray,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  disabledButtonText: {
    color: Colors.grayMedium,
  },
  messageListContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.grayMedium,
  },
});
