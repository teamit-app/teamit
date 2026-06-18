import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  SectionList,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChatRooms();
  }, []);

  useEffect(() => {
    filterAndOrganizeRooms();
  }, [chatRooms, searchText]);

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

  const filterAndOrganizeRooms = () => {
    let filtered = chatRooms;

    if (searchText.trim()) {
      filtered = filtered.filter((room) =>
        room.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 단체 채팅과 1:1 매칭 채팅으로 분리
    const groupChats = filtered.filter((room) => room.type === 'group');
    const directChats = filtered.filter((room) => room.type === 'direct');

    const newSections: SectionData[] = [];

    if (groupChats.length > 0) {
      newSections.push({
        title: '단체 채팅',
        data: groupChats,
      });
    }

    if (directChats.length > 0) {
      newSections.push({
        title: '1:1 매칭 채팅',
        data: directChats,
      });
    }

    setSections(newSections);
  };

  const handleChatPress = (chatId: number) => {
    router.push({
      pathname: '/(tabs)/messages/[chatId]',
      params: { chatId: chatId.toString() },
    });
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>메시지가 없어요</Text>
      <Text style={styles.emptySubtitle}>채팅을 시작해보세요</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="메시지" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="메시지" />

      {/* 배너 */}
      <View style={styles.bannerContainer}>
        <Text style={styles.bannerIcon}>💔</Text>
        <Text style={styles.bannerText}>새로운 팀매칭 제의가 2건 있어요!</Text>
      </View>

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

      {/* 섹션별 채팅 목록 */}
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
          renderSectionHeader={renderSectionHeader}
          scrollEnabled={true}
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  bannerContainer: {
    backgroundColor: '#FFE8D6',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  bannerIcon: {
    fontSize: 16,
  },
  bannerText: {
    fontSize: 13,
    color: Colors.dark,
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
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
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
