import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { useBuildTeamStore } from '../../../../src/store/useBuildTeamStore';

const PRESET_SKILLS = [
  'Figma', 'Sketch', '기획', '마케팅', '영상편집', 'Photoshop',
  'Zeplin', 'Protopie', 'React', 'TypeScript', 'JavaScript',
  'Flutter', 'SwiftUI', 'Python', 'FastAPI', 'Spring Boot',
  'Node.js', 'AWS', 'Firebase', '디자인',
];

const TOTAL_STEPS = 5;
const CURRENT_STEP = 2;

export default function RecruitSkillsScreen() {
  const insets = useSafeAreaInsets();
  const { contestId, returnToConfirm } = useLocalSearchParams<{ contestId: string; returnToConfirm: string }>();
  const selectedSkills = useBuildTeamStore((s) => s.requiredSkills);
  const toggleSkill = useBuildTeamStore((s) => s.toggleSkill);
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? PRESET_SKILLS.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : PRESET_SKILLS;

  const handleDirectAdd = () => {
    if (!query.trim()) {
      Alert.alert('직접 추가', '검색창에 추가할 스킬을 입력한 뒤 눌러주세요.');
      return;
    }
    const trimmed = query.trim();
    if (!selectedSkills.includes(trimmed)) toggleSkill(trimmed);
    setQuery('');
  };

  const goNext = () => {
    if (returnToConfirm === 'true') {
      router.push(`/explore/build-team/recruit-confirm?contestId=${contestId}` as never);
    } else {
      router.push(`/explore/build-team/recruit-conditions?contestId=${contestId}` as never);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>필요 기술 스택 및 역할</Text>
        <Text style={styles.stepText}>{CURRENT_STEP}/{TOTAL_STEPS}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 타이틀 */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>어떤 기술을 가진 팀원이 필요한가요?</Text>
          <View style={styles.optionalBadge}>
            <Text style={styles.optionalBadgeText}>선택 사항</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>팀원이 갖췄으면 하는 기술 스택과 역할을 선택해 주세요.</Text>

        {/* 검색 입력 */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="기술 및 역할 검색... (예: SQL, React, Figma)"
            placeholderTextColor={Colors.grayLight}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* 스킬 그리드 */}
        <View style={styles.chipGrid}>
          {filtered.map((skill) => {
            const selected = selectedSkills.includes(skill);
            return (
              <TouchableOpacity
                key={skill}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleSkill(skill)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {selected ? `${skill} ✓` : skill}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* 직접 추가하기 */}
          <TouchableOpacity
            style={styles.chipAdd}
            onPress={handleDirectAdd}
            activeOpacity={0.75}
          >
            <Text style={styles.chipAddText}>직접 추가하기</Text>
          </TouchableOpacity>
        </View>

        {/* 선택된 스킬 및 역할 */}
        {selectedSkills.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedSectionLabel}>선택된 스킬 및 역할</Text>
            <View style={styles.selectedChipRow}>
              {selectedSkills.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={styles.selectedChip}
                  onPress={() => toggleSkill(skill)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.selectedChipText}>{skill}</Text>
                  <Text style={styles.selectedChipX}> ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
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

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.dark },
  optionalBadge: {
    backgroundColor: Colors.pageBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  optionalBadgeText: { fontSize: 12, color: Colors.grayMedium },
  subtitle: { fontSize: 14, color: Colors.gray, lineHeight: 21, marginBottom: 20 },

  // 검색창
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 20,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.dark },

  // 스킬 그리드
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },

  chip: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  chipText: { fontSize: 14, color: Colors.dark },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },

  chipAdd: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderStyle: 'dashed',
  },
  chipAddText: { fontSize: 14, color: Colors.grayMedium },

  // 선택된 스킬 섹션
  selectedSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  selectedSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grayMedium,
    marginBottom: 12,
  },
  selectedChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectedChipText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  selectedChipX: { fontSize: 14, color: Colors.primary, fontWeight: '400' },

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
