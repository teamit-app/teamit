import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  SectionList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { ChatRoomItem } from '../../../src/components/messages/ChatRoomItem';
import { getChatRooms } from '../../../src/services/messageService';
import { ChatRoom } from '../../../src/types/message';

interface SectionData {
  title: string;
  data: ChatRoom[];
}

export default function MessagesScreen() {
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadChatRooms();
    }, []),
  );

  useEffect(() => {
    buildSections();
  }, [chatRooms]);

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      const rooms = await getChatRooms();
      setChatRooms(rooms);
    } catch (e) {
      console.error('Failed to load chat rooms:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const buildSections = () => {
    const group = chatRooms.filter((r) => r.type === 'group');
    const direct = chatRooms.filter((r) => r.type === 'direct');
    const result: SectionData[] = [];
    if (group.length > 0) result.push({ title: '단체 채팅', data: group });
    if (direct.length > 0) result.push({ title: '1:1 채팅', data: direct });
    setSections(result);
  };

  const handleChatPress = (chatId: number) => {
    router.push(`/messages/${chatId}` as never);
  };

  const totalUnread = chatRooms.reduce((sum, r) => sum + r.unreadCount, 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="메시지" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="메시지" />

      {totalUnread > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>💌</Text>
          <Text style={styles.bannerText}>
            새로운 팀매칭 제의가 {totalUnread}건 있어요!
          </Text>
        </View>
      )}

      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ChatRoomItem
              chatRoom={item}
              onPress={() => handleChatPress(item.id)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>메시지가 없어요</Text>
          <Text style={styles.emptySub}>채팅을 시작해보세요</Text>
        </View>
      )}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.ogTint,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bannerIcon: {
    fontSize: 16,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginLeft: 84,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.grayMedium,
    marginTop: 4,
  },
});
