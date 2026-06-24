import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';

type ExperienceOption = {
  key: 'contest' | 'certificate';
  icon: string;
  title: string;
  desc: string;
  route: string;
};

const OPTIONS: ExperienceOption[] = [
  {
    key: 'contest',
    icon: '🏆',
    title: '공모전',
    desc: '수상 경험과 역할을 기록해요',
    route: '/(tabs)/profile/add-contest',
  },
  {
    key: 'certificate',
    icon: '📜',
    title: '자격증',
    desc: '취득한 자격증 정보를 등록해요',
    route: '/(tabs)/profile/add-certificate',
  },
];

export default function AddExperienceScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="경험 추가" onBack={() => router.back()} />

      <View style={styles.body}>
        <Text style={styles.heading}>어떤 경험을 추가할까요?</Text>
        <Text style={styles.subHeading}>
          항목을 선택하면 해당 입력 화면으로 이동해요
        </Text>

        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(opt.route as never)}
          >
            <Text style={styles.cardIcon}>{opt.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{opt.title}</Text>
              <Text style={styles.cardDesc}>{opt.desc}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  body: { padding: 20 },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  cardIcon: { fontSize: 28, marginRight: 14 },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  cardDesc: { fontSize: 13, color: Colors.gray, marginTop: 4 },
  chevron: { fontSize: 22, color: Colors.grayMedium },
});
