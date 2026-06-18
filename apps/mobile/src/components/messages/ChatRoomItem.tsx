import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { ChatRoom } from '../../types/message';

interface ChatRoomItemProps {
  chatRoom: ChatRoom;
  onPress: () => void;
}

const getParticipantLabel = (chatRoom: ChatRoomItemProps['chatRoom']): string | null => {
  if (chatRoom.type !== 'group') return null;
  const others = chatRoom.participants.filter((p) => p.id !== 1);
  if (others.length === 0) return null;
  if (others.length <= 2) return others.map((p) => p.name).join(', ');
  return `${others.slice(0, 2).map((p) => p.name).join(', ')}, 외 ${others.length - 2}명`;
};

export const ChatRoomItem: React.FC<ChatRoomItemProps> = ({ chatRoom, onPress }) => {
  const hasUnread = chatRoom.unreadCount > 0;
  const participantLabel = getParticipantLabel(chatRoom);
  return (
    <TouchableOpacity
      style={[styles.container, hasUnread && styles.containerUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{chatRoom.avatar}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{chatRoom.name}</Text>
          <Text style={styles.time}>{formatTime(chatRoom.lastMessageAt)}</Text>
        </View>
        {participantLabel && (
          <Text style={styles.participants} numberOfLines={1}>{participantLabel}</Text>
        )}
        <View style={styles.bottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chatRoom.lastMessage}
          </Text>
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {chatRoom.unreadCount > 99 ? '99+' : chatRoom.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHr < 24) return `${diffHr}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.white,
  },
  containerUnread: {
    backgroundColor: '#FFF8F2',
  },
  avatarWrap: {
    marginRight: 12,
    flexShrink: 0,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    height: 52,
    lineHeight: 52,
    includeFontPadding: false,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: Colors.grayMedium,
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participants: {
    fontSize: 11,
    color: Colors.grayLight,
    marginBottom: 1,
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: Colors.grayMedium,
    lineHeight: 18,
    marginRight: 8,
  },
});
