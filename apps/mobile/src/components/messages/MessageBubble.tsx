import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Message } from '../../types/message';

interface MessageBubbleProps {
  message: Message;
  showSenderName?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showSenderName = false }) => {
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

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{message.senderAvatar}</Text>
        </View>
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
    maxWidth: '72%',
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
