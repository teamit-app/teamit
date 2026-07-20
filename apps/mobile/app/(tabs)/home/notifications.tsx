import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { getNotifications, markAllNotificationsAsRead } from '../../../src/services/notificationService';
import { useNotificationStore } from '../../../src/store/useNotificationStore';
import { AppNotification, NotificationType } from '../../../src/types/notification';

const TYPE_ICON: Record<NotificationType, string> = {
  MATCH_PROPOSAL: '💌',
  PROPOSAL_RESPONSE: '📣',
  DEADLINE: '⏰',
  MESSAGE: '💬',
  MATCH_SUCCESS: '✅',
  ANNOUNCEMENT: '📢',
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    getNotifications()
      .then(({ notifications }) => setNotifications(notifications))
      .catch((e) => console.error('[Notifications] 알림 로드 실패:', e));

    markAllNotificationsAsRead()
      .then(() => useNotificationStore.getState().reset())
      .catch((e) => console.error('[Notifications] 읽음 처리 실패:', e));
  }, []);

  const handlePress = (notification: AppNotification) => {
    if (notification.type === 'MATCH_PROPOSAL' && notification.referenceType === 'INVITATION') {
      router.push(`/messages/invitation-detail/${notification.referenceId}` as never);
    } else if (notification.type === 'MATCH_PROPOSAL' && notification.referenceType === 'APPLICATION') {
      router.push('/profile/received-applications' as never);
    } else if (notification.type === 'PROPOSAL_RESPONSE') {
      router.push('/profile/my-applications' as never);
    } else if (notification.type === 'MATCH_SUCCESS') {
      router.push(`/messages/${notification.referenceId}` as never);
    }
  };

  const groups = Array.from(new Set(notifications.map((n) => n.group)));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="알림" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {groups.length === 0 && (
          <Text style={styles.emptyText}>알림이 없습니다</Text>
        )}
        {groups.map((group) => (
          <View key={group}>
            <Text style={styles.groupLabel}>{group}</Text>
            {notifications
              .filter((n) => n.group === group)
              .map((notification) => (
                <TouchableOpacity
                  key={notification.notificationId}
                  style={[styles.row, !notification.isRead && styles.rowUnread]}
                  activeOpacity={0.7}
                  onPress={() => handlePress(notification)}
                >
                  <View style={styles.dotColumn}>
                    {!notification.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <View style={[styles.iconCircle, !notification.isRead && styles.iconCircleUnread]}>
                    <Text style={styles.icon}>{TYPE_ICON[notification.type]}</Text>
                  </View>
                  <View style={styles.textColumn}>
                    <Text style={styles.title}>{notification.title}</Text>
                    <Text style={styles.body} numberOfLines={1}>{notification.body}</Text>
                    <Text style={styles.time}>{notification.relativeTime}</Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowUnread: {
    backgroundColor: Colors.ogTint,
  },
  dotColumn: {
    width: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleUnread: {
    backgroundColor: Colors.white,
  },
  icon: {
    fontSize: 20,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  body: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 3,
  },
  time: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.grayMedium,
    fontSize: 14,
    marginTop: 80,
  },
});
