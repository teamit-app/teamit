import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Message } from '../../types/message';

// 카드 너비: 화면 너비 - 아바타(44) - 양쪽 패딩(32) - 시간텍스트(30) - 여백(14)
const CARD_WIDTH = Dimensions.get('window').width - 120;

interface MessageBubbleProps {
  message: Message;
  showSenderName?: boolean;
  onPressAvatar?: (senderId: number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showSenderName = false, onPressAvatar }) => {
  const router = useRouter();

  if (message.isSystem) {
    return (
      <View style={styles.systemRow}>
        <View style={styles.systemPill}>
          <Text style={styles.systemText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  const isOwn = message.isSent;

  // ── 초대 카드 메시지 ──────────────────────────────────────────────────────
  if (message.invitationCard) {
    const card = message.invitationCard;
    return (
      <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
        {!isOwn && (
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => onPressAvatar?.(message.senderId)}
            activeOpacity={onPressAvatar ? 0.7 : 1}
          >
            <Text style={styles.avatarText}>{message.senderAvatar}</Text>
          </TouchableOpacity>
        )}
        <View style={[styles.group, isOwn && styles.groupOwn]}>
          {!isOwn && showSenderName && (
            <Text style={styles.senderName}>{message.senderName}</Text>
          )}
          <View style={styles.bubbleRow}>
            {isOwn && (
              <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
            )}
            <View style={cardStyles.card}>
              <View style={cardStyles.topRow}>
                <View style={cardStyles.iconCircle}>
                  <Text style={cardStyles.iconText}>🏆</Text>
                </View>
                <View style={cardStyles.info}>
                  <Text style={cardStyles.title} numberOfLines={2}>{card.title}</Text>
                  <Text style={cardStyles.meta}>
                    {card.currentMembers}/{card.totalMembers}명{'  '}{card.contestName}
                  </Text>
                  <View style={cardStyles.bottomRow}>
                    <Text style={cardStyles.sender}>
                      {card.senderName}님이 초대장을 보냈습니다
                    </Text>
                    <TouchableOpacity
                      style={cardStyles.moreBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        const iid = card.invitationId ?? 1;
                        const pid = card.postId ?? 1;
                        router.push(
                          `/(tabs)/messages/invitation-detail/${iid}?postId=${pid}` as never
                        );
                      }}
                    >
                      <Text style={cardStyles.moreBtnText}>더보기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            {!isOwn && (
              <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── 일반 텍스트 메시지 ────────────────────────────────────────────────────
  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn && (
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => onPressAvatar?.(message.senderId)}
          activeOpacity={onPressAvatar ? 0.7 : 1}
        >
          <Text style={styles.avatarText}>{message.senderAvatar}</Text>
        </TouchableOpacity>
      )}
      <View style={[styles.group, isOwn && styles.groupOwn]}>
        {!isOwn && showSenderName && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}
        <View style={styles.bubbleRow}>
          {isOwn && (
            <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
          )}
          <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
            <Text style={[styles.text, isOwn && styles.textOwn]}>{message.content}</Text>
          </View>
          {!isOwn && (
            <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 3,
    alignItems: 'flex-end',
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.ogTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 18,
  },
  group: {
    maxWidth: '78%',
  },
  groupOwn: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    flexShrink: 1,
  },
  bubbleOwn: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.pageBg,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 20,
  },
  textOwn: {
    color: Colors.white,
  },
  time: {
    fontSize: 10,
    color: Colors.grayMedium,
    marginBottom: 2,
    flexShrink: 0,
  },
  systemRow: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemPill: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  systemText: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    backgroundColor: Colors.white,
    width: CARD_WIDTH,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sender: {
    fontSize: 12,
    color: Colors.grayMedium,
    flex: 1,
    marginRight: 8,
  },
  moreBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  moreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
});
