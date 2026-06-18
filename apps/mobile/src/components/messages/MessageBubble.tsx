import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Message } from '../../types/message';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  if (message.isSystem) {
    return (
      <View style={styles.systemContainer}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  const isOwn = message.isSent;

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      {!isOwn && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{message.senderAvatar}</Text>
        </View>
      )}
      <View style={[styles.bubbleContainer, isOwn && styles.bubbleContainerOwn]}>
        {!isOwn && <Text style={styles.senderName}>{message.senderName}</Text>}
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.text, isOwn && styles.textOwn]}>{message.content}</Text>
        </View>
        <Text style={[styles.timestamp, isOwn && styles.timestampOwn]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  containerOwn: {
    justifyContent: 'flex-end',
  },
  containerOther: {
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
  },
  avatarText: {
    fontSize: 18,
  },
  bubbleContainer: {
    maxWidth: '70%',
  },
  bubbleContainerOwn: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 11,
    color: Colors.grayMedium,
    marginBottom: 4,
    marginLeft: 8,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
  },
  bubbleOwn: {
    backgroundColor: Colors.primary,
  },
  bubbleOther: {
    backgroundColor: Colors.lightGray,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemBubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  systemText: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
  text: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 20,
  },
  textOwn: {
    color: Colors.white,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.grayMedium,
    marginTop: 4,
    marginLeft: 8,
  },
  timestampOwn: {
    marginLeft: 0,
    marginRight: 8,
  },
});
