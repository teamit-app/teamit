import React, { useEffect, useState } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '../../../src/services/mypageService';
import { NotificationSettings } from '../../../src/types/mypage';
import { trackEvent } from '../../../src/services/gtm';

const SETTINGS_CONFIG: {
  key: keyof NotificationSettings;
  title: string;
  desc: string;
  disabled?: boolean;
}[] = [
  {
    key: 'matchProposal',
    title: '팀 매칭 제안',
    desc: '베타테스트 기간에는 제공하지 않아요',
    disabled: true,
  },
  {
    key: 'proposalResponse',
    title: '제안 답변',
    desc: '베타테스트 기간에는 제공하지 않아요',
    disabled: true,
  },
  {
    key: 'deadlineAlert',
    title: '마감 알림',
    desc: '베타테스트 기간에는 제공하지 않아요',
    disabled: true,
  },
  {
    key: 'messageAlert',
    title: '메시지 알림',
    desc: '베타테스트 기간에는 제공하지 않아요',
    disabled: true,
  },
  {
    key: 'matchSuccess',
    title: '매칭 성사',
    desc: '베타테스트 기간에는 제공하지 않아요',
    disabled: true,
  },
  {
    key: 'announcement',
    title: '공지 · 업데이트',
    desc: '베타테스트 기간에는 제공하지 않아요',
    disabled: true,
  },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<NotificationSettings>({
    matchProposal: true,
    proposalResponse: true,
    deadlineAlert: true,
    messageAlert: true,
    matchSuccess: true,
    announcement: true,
  });

  useEffect(() => {
    getNotificationSettings().then(setSettings).catch(() => {});
  }, []);

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    const prev = settings;
    setSettings({ ...settings, [key]: value });
    trackEvent('notification_toggle', { item_type: key, action: value ? 'enable' : 'disable' });
    try {
      await updateNotificationSettings({ [key]: value });
    } catch {
      setSettings(prev);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="알림 설정" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {SETTINGS_CONFIG.map(({ key, title, desc, disabled }, idx) => (
          <View key={key} style={[styles.row, idx === 0 && styles.rowFirst]}>
            <View style={styles.textCol}>
              <Text style={[styles.rowTitle, disabled && styles.rowTitleDisabled]}>{title}</Text>
              <Text style={[styles.rowDesc, disabled && styles.rowDescDisabled]}>{desc}</Text>
            </View>
            <Switch
              value={disabled ? false : settings[key]}
              onValueChange={(v) => handleToggle(key, v)}
              disabled={disabled}
              trackColor={{ false: Colors.lightGray, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  rowFirst: { borderTopWidth: 0 },
  textCol: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.dark, marginBottom: 3 },
  rowTitleDisabled: { color: Colors.grayMedium },
  rowDesc: { fontSize: 13, color: Colors.gray },
  rowDescDisabled: { color: Colors.lightGray },
});
