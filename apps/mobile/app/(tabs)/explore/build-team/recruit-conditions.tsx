import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { useBuildTeamStore } from '../../../../src/store/useBuildTeamStore';

const TOTAL_STEPS = 5;
const CURRENT_STEP = 3;

const GENDER_OPTIONS = [
  { value: '상관없음', label: '상관없음', icon: '⚧️', desc: '모든 성별 누구나 환영해요' },
  { value: '동성만', label: '동성만', icon: '👥', desc: '같은 성별만 선호해요' },
];

const SCHOOL_OPTIONS = [
  { value: '학교 상관없음', label: '학교 상관없음', icon: '🏫', desc: '전국 누구나 환영해요' },
  { value: '같은 학교만', label: '같은 학교만', icon: '🎓', desc: '같은 대학 출신만 선호해요' },
];

const EXPERIENCE_OPTIONS = [
  { value: '공모전 경험 무관', label: '경험 무관', icon: '📖', desc: '공모전이 처음인 사람도 환영해요' },
  { value: '공모전 경험자 선호', label: '경험자 선호', icon: '📚', desc: '공모전 경험자만 선호해요' },
];

function ConditionCard({
  icon,
  label,
  desc,
  selected,
  onPress,
}: {
  icon: string;
  label: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {selected && (
        <View style={styles.checkBadge}>
          <Text style={styles.checkBadgeText}>✓</Text>
        </View>
      )}
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>{label}</Text>
      <Text style={[styles.cardDesc, selected && styles.cardDescSelected]}>{desc}</Text>
    </TouchableOpacity>
  );
}

function Section({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: { value: string; label: string; icon: string; desc: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.cardRow}>
        {options.map((opt) => (
          <ConditionCard
            key={opt.value}
            icon={opt.icon}
            label={opt.label}
            desc={opt.desc}
            selected={selected === opt.value}
            onPress={() => onSelect(opt.value)}
          />
        ))}
      </View>
    </View>
  );
}

export default function RecruitConditionsScreen() {
  const insets = useSafeAreaInsets();
  const { contestId, returnToConfirm } = useLocalSearchParams<{ contestId: string; returnToConfirm: string }>();

  const gender = useBuildTeamStore((s) => s.genderCondition);
  const school = useBuildTeamStore((s) => s.schoolCondition);
  const experience = useBuildTeamStore((s) => s.experienceCondition);
  const setGender = useBuildTeamStore((s) => s.setGenderCondition);
  const setSchool = useBuildTeamStore((s) => s.setSchoolCondition);
  const setExperience = useBuildTeamStore((s) => s.setExperienceCondition);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>참여 조건 설정</Text>
        <Text style={styles.stepText}>{CURRENT_STEP}/{TOTAL_STEPS}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>팀원 조건을 설정해 주세요</Text>

        <Section
          title="성별 조건"
          options={GENDER_OPTIONS}
          selected={gender}
          onSelect={setGender}
        />
        <Section
          title="출신 대학교 조건"
          options={SCHOOL_OPTIONS}
          selected={school}
          onSelect={setSchool}
        />
        <Section
          title="공모전 경험 조건"
          options={EXPERIENCE_OPTIONS}
          selected={experience}
          onSelect={setExperience}
        />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() =>
            returnToConfirm === 'true'
                ? router.push(`/explore/build-team/recruit-confirm?contestId=${contestId}` as never)
                : router.push(`/explore/build-team/recruit-post?contestId=${contestId}` as never)
          }
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>다음</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { width: 32 },
  backIcon: { fontSize: 28, color: Colors.dark, lineHeight: 32 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark,
  },
  stepText: {
    width: 32,
    textAlign: 'right',
    fontSize: 13,
    color: Colors.grayMedium,
  },

  // 진행 바
  progressBar: { height: 3, backgroundColor: Colors.lightGray },
  progressFill: { height: 3, backgroundColor: Colors.primary },

  // 본문
  content: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 28,
  },

  // 섹션
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // 조건 카드
  card: {
    flex: 1,
    backgroundColor: Colors.pageBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.pageBg,
    padding: 14,
    minHeight: 110,
  },
  cardSelected: {
    backgroundColor: Colors.ogTint,
    borderColor: Colors.primary,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '700',
  },
  cardIcon: { fontSize: 26, marginBottom: 8 },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  cardLabelSelected: { color: Colors.primary },
  cardDesc: { fontSize: 12, color: Colors.grayMedium, lineHeight: 17 },
  cardDescSelected: { color: Colors.primary },

  // 하단
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
