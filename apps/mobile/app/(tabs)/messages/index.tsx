import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { ChatRoomItem } from '../../../src/components/messages/ChatRoomItem';
import { getChatRooms } from '../../../src/services/messageService';
import { ChatRoom } from '../../../src/types/message';

type TabType = 'new' | 'read';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChatRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [chatRooms, activeTab, searchText]);

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      const rooms = await getChatRooms();
      setChatRooms(rooms);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = chatRooms;

    // 새로운/읽음 탭 필터링 (현재는 모든 채팅을 새로운으로 표시)
    if (activeTab === 'new') {
      filtered = filtered.filter((room) => room.unreadCount > 0 || true);
    } else {
      filtered = filtered.filter((room) => room.unreadCount === 0);
    }

    if (searchText.trim()) {
      filtered = filtered.filter((room) =>
        room.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredRooms(filtered);
  };

  const handleChatPress = (chatId: number) => {
    router.push({
      pathname: '/(tabs)/messages/[chatId]',
      params: { chatId: chatId.toString() },
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>메시지가 없어요</Text>
      <Text style={styles.emptySubtitle}>채팅을 시작해보세요</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="메시지" />

      {/* 최근 받은 메시지 배너 */}
      {chatRooms.some((room) => room.unreadCount > 0) && (
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerText}>최근 받은 메시지가 있어요</Text>
        </View>
      )}

      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="채팅 검색"
          placeholderTextColor={Colors.grayMedium}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* 탭 버튼 - 새로운/읽음 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'new' && styles.tabButtonActive]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
            새로운
          </Text>
          {activeTab === 'new' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'read' && styles.tabButtonActive]}
          onPress={() => setActiveTab('read')}
        >
          <Text style={[styles.tabText, activeTab === 'read' && styles.tabTextActive]}>
            읽음
          </Text>
          {activeTab === 'read' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* 채팅 목록 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredRooms.length > 0 ? (
        <FlatList
          data={filteredRooms}
          renderItem={({ item }) => (
            <ChatRoomItem
              chatRoom={item}
              onPress={() => handleChatPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={true}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  bannerContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.pageBg,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonActive: {},
  tabText: {
    fontSize: 14,
    color: Colors.grayMedium,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    width: '100%',
    height: 2,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.grayMedium,
    textAlign: 'center',
  },
});
