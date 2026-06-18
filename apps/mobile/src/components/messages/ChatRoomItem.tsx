import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { ChatRoom } from '../../types/message';

interface ChatRoomItemProps {
  chatRoom: ChatRoom;
  onPress: () => void;
}

export const ChatRoomItem: React.FC<ChatRoomItemProps> = ({ chatRoom, onPress }) => {
  const timeString = formatTime(chatRoom.lastMessageAt);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* 아바타 */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{chatRoom.avatar}</Text>
        </View>
        {chatRoom.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {chatRoom.unreadCount > 99 ? '99+' : chatRoom.unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* 메시지 내용 */}
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.name}>{chatRoom.name}</Text>
          <Text style={styles.time}>{timeString}</Text>
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.senderName}>{chatRoom.lastMessageBy}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chatRoom.lastMessage}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffMinutes < 1) return '방금';
  if (diffMinutes < 60) return `${diffMinutes}분`;
  if (diffHours < 24) return `${diffHours}시간`;
  if (diffDays < 7) return `${diffDays}일`;

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.ogTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
    paddingHorizontal: 4,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  time: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginRight: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: 12,
    color: Colors.grayMedium,
  },
});
