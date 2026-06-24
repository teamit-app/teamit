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

const SETTINGS_CONFIG: {
  key: keyof NotificationSettings;
  title: string;
  desc: string;
}[] = [
  {
    key: 'matchProposal',
    title: '팀 매칭 제안',
    desc: '모집자로부터 제안이 올 때 알림을 받아요',
  },
  {
    key: 'proposalResponse',
    title: '제안 답변',
    desc: '내가 보낸 제안에 응답이 왔을 때',
  },
  {
    key: 'deadlineAlert',
    title: '마감 알림',
    desc: '관심 공모전 마감 3일 전 알림',
  },
  {
    key: 'messageAlert',
    title: '메시지 알림',
    desc: '새 메시지가 도착했을 때',
  },
  {
    key: 'matchSuccess',
    title: '매칭 성사',
    desc: '팀 매칭이 성사됐을 때',
  },
  {
    key: 'announcement',
    title: '공지 · 업데이트',
    desc: '티밋 서비스 공지 및 업데이트',
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
        {SETTINGS_CONFIG.map(({ key, title, desc }, idx) => (
          <View key={key} style={[styles.row, idx === 0 && styles.rowFirst]}>
            <View style={styles.textCol}>
              <Text style={styles.rowTitle}>{title}</Text>
              <Text style={styles.rowDesc}>{desc}</Text>
            </View>
            <Switch
              value={settings[key]}
              onValueChange={(v) => handleToggle(key, v)}
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
  rowDesc: { fontSize: 13, color: Colors.gray },
});
