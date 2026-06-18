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
        data={[...messages].reverse()}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={true}
        contentContainerStyle={styles.messageListContent}
      />

      {/* 메시지 입력 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
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
