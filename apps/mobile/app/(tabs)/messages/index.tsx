import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  SectionList,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { ChatRoomItem } from '../../../src/components/messages/ChatRoomItem';
import { getChatRooms } from '../../../src/services/messageService';
import { getInvitations } from '../../../src/services/invitationService';
import { ChatRoom } from '../../../src/types/message';
import { Invitation } from '../../../src/types/invitation';

type Tab = 'chats' | 'invitations';

interface SectionData {
  title: string;
  data: ChatRoom[];
  hint?: string;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, []),
  );

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [rooms, invites] = await Promise.all([getChatRooms(), getInvitations()]);
      setInvitations(invites);
      buildSections(rooms);
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const buildSections = (rooms: ChatRoom[]) => {
    const group = rooms.filter((r) => r.type === 'group');
    const direct = rooms.filter((r) => r.type === 'direct');
    setSections([
      {
        title: '팀 채팅',
        data: group,
        hint: "공모전 탭에서 '팀원 직접 꾸리기'를 완료하거나 팀 초대를 수락하면 팀 채팅방이 만들어져요!",
      },
      {
        title: '1:1 채팅',
        data: direct,
        hint: direct.length === 0 ? '지원하기 또는 팀 초대를 통해 상대방과 1:1 채팅을 시작할 수 있어요!' : undefined,
      },
    ]);
  };

  const handleChatPress = (chatId: number) => {
    router.push(`/messages/${chatId}` as never);
  };

  const handleInvitationPress = (invitation: Invitation) => {
    router.push(
      `/messages/invitation-detail/${invitation.invitationId}?postId=${invitation.postId}` as never,
    );
  };

  const invitationCount = invitations.length;

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

      {/* ── 탭 바 ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chats' && styles.tabActive]}
          onPress={() => setActiveTab('chats')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.tabTextActive]}>
            전체 채팅방
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invitations' && styles.tabActive]}
          onPress={() => setActiveTab('invitations')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'invitations' && styles.tabTextActive]}>
            받은 초대장
          </Text>
          {invitationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{invitationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── 초대장 배너 ── */}
      {invitationCount > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>{activeTab === 'invitations' ? '🎉' : '💌'}</Text>
          <Text style={styles.bannerText}>
            {invitationCount}개의 팀으로부터 초대장을 받았어요!
          </Text>
        </View>
      )}

      {/* ── 전체 채팅방 탭 ── */}
      {activeTab === 'chats' && (
        sections.length > 0 ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, section }) =>
              section.data.length === 0 ? null : (
                <ChatRoomItem chatRoom={item} onPress={() => handleChatPress(item.id)} />
              )
            }
            renderSectionHeader={({ section }) => (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                {section.hint && (
                  <View style={styles.hintRow}>
                    <Text style={styles.hintText}>{section.hint}</Text>
                  </View>
                )}
                {section.data.length === 0 && (
                  <View style={styles.emptySectionBox}>
                    <Text style={styles.emptySectionIcon}>
                      {section.title === '팀 채팅' ? '👥' : '💬'}
                    </Text>
                    <Text style={styles.emptySectionText}>
                      {section.title === '팀 채팅' ? '팀 채팅이 없어요' : '1:1 채팅이 없어요'}
                    </Text>
                  </View>
                )}
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
        )
      )}

      {/* ── 받은 초대장 탭 ── */}
      {activeTab === 'invitations' && (
        invitationCount > 0 ? (
          <View style={{ flex: 1 }}>
            <View style={styles.invitationListHeader}>
              <Text style={styles.invitationListTitle}>받은 초대장</Text>
              <Text style={styles.invitationListCount}> {invitationCount}</Text>
            </View>
            <FlatList
              data={invitations}
              keyExtractor={(item) => item.invitationId.toString()}
              renderItem={({ item }) => (
                <InvitationCard invitation={item} onPress={() => handleInvitationPress(item)} />
              )}
              contentContainerStyle={styles.invitationListContent}
            />
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>받은 초대장이 없어요</Text>
            <Text style={styles.emptySub}>팀 초대를 기다려보세요</Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
}

// ── 초대장 카드 컴포넌트 ────────────────────────────────────────────────────────
function InvitationCard({
  invitation,
  onPress,
}: {
  invitation: Invitation;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={inviteStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={inviteStyles.topRow}>
        <View style={inviteStyles.avatarCircle}>
          <Text style={inviteStyles.avatarEmoji}>🏆</Text>
        </View>
        <View style={inviteStyles.info}>
          <Text style={inviteStyles.title} numberOfLines={1}>
            {invitation.title}
          </Text>
          <Text style={inviteStyles.meta}>
            {invitation.currentMembers}/{invitation.totalMembers}명 · {invitation.contestName}
          </Text>
          <Text style={inviteStyles.sender}>
            {invitation.senderName}님이 초대장을 보냈습니다
          </Text>
        </View>
        <View style={inviteStyles.right}>
          <Text style={inviteStyles.time}>{invitation.receivedAt}</Text>
          <View style={inviteStyles.moreBtn}>
            <Text style={inviteStyles.moreBtnText}>더보기</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── 스타일 ─────────────────────────────────────────────────────────────────────

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

  // 탭 바
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.pageBg,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  tabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.grayMedium,
  },
  tabTextActive: {
    fontWeight: '700',
    color: Colors.dark,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },

  // 배너
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

  // 채팅방 섹션
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  hintRow: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: Colors.white,
  },
  hintText: {
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 18,
  },
  emptySectionBox: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  emptySectionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptySectionText: {
    fontSize: 14,
    color: Colors.grayMedium,
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

  // 초대장 목록 헤더
  invitationListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  invitationListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  invitationListCount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  invitationListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
});

const inviteStyles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    backgroundColor: Colors.white,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  meta: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
  sender: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
  },
  time: {
    fontSize: 11,
    color: Colors.grayLight,
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
