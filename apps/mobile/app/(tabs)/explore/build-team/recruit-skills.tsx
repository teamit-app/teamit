import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from '../../../../src/utils/alert';
import { Colors } from '../../../../src/constants/colors';
import { useBuildTeamStore } from '../../../../src/store/useBuildTeamStore';
import { trackEvent } from '../../../../src/services/gtm';

const SKILL_CATEGORIES: Record<string, string[]> = {
  전체: [],
  디자인: ['Figma', 'Sketch', 'Photoshop', 'Zeplin', 'Protopie', '영상편집', '디자인'],
  // 세부 기술 스택을 잘 모르는 모집자도 고를 수 있도록 상위 개념의 범용 항목을 함께 제공한다
  개발: ['개발', '프론트엔드 개발', '백엔드 개발', 'AI', 'React', 'TypeScript', 'JavaScript', 'Flutter', 'SwiftUI', 'Python', 'FastAPI', 'Spring Boot', 'Node.js', 'AWS', 'Firebase'],
  기획: ['기획', 'PM', 'UX Research'],
  마케팅: ['마케팅', '퍼포먼스 마케팅', '콘텐츠 마케팅', 'SNS 운영', '브랜드 마케팅', 'GA4', '메타 광고관리자', '카피라이팅'],
  데이터: ['데이터 분석', 'SQL', 'Python', 'R', 'Tableau', 'Power BI', 'Excel', 'Pandas'],
};

const ALL_SKILLS = Object.values(SKILL_CATEGORIES)
  .flat()
  .filter((v, i, a) => a.indexOf(v) === i);

const TOTAL_STEPS = 5;
const CURRENT_STEP = 2;

export default function RecruitSkillsScreen() {
  const insets = useSafeAreaInsets();
  const { contestId, returnToConfirm, editPostId, sourceTab, fullEdit } = useLocalSearchParams<{
    contestId: string;
    returnToConfirm: string;
    editPostId?: string;
    sourceTab?: string;
    fullEdit?: string;
  }>();
  const editSuffix = editPostId
    ? `&editPostId=${editPostId}&sourceTab=${sourceTab ?? 'explore'}&fullEdit=${fullEdit ?? ''}`
    : '';
  const selectedSkills = useBuildTeamStore((s) => s.requiredSkills);
  const toggleSkill = useBuildTeamStore((s) => s.toggleSkill);

  const [query, setQuery] = useState('');
  const [skillCategory, setSkillCategory] = useState('전체');

  const displayedSkills = query.trim()
    ? ALL_SKILLS.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : skillCategory === '전체' ? ALL_SKILLS : (SKILL_CATEGORIES[skillCategory] ?? []);

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
      // confirm → push로 들어온 수정 화면이므로 되돌아갈 땐 replace (사유: recruit-count.tsx 참고)
      router.replace(`/explore/build-team/recruit-confirm?contestId=${contestId}` as never);
    } else {
      trackEvent('recruit_step_complete', { contest_id: Number(contestId), step: CURRENT_STEP });
      router.push(`/explore/build-team/recruit-conditions?contestId=${contestId}${editSuffix}` as never);
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

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
            placeholderTextColor={Colors.grayMedium}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 카테고리 탭 — 검색 중에는 숨김 */}
        {!query.trim() && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={{ gap: 8 }}
          >
            {Object.keys(SKILL_CATEGORIES).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, skillCategory === cat && styles.catChipActive]}
                onPress={() => setSkillCategory(cat)}
              >
                <Text style={[styles.catChipText, skillCategory === cat && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 섹션 라벨 */}
        {!query.trim() && (
          <Text style={styles.sectionLabel}>
            {skillCategory === '전체' ? '전체 스킬' : `${skillCategory} 스킬`}
          </Text>
        )}

        {/* 스킬 그리드 */}
        <View style={styles.chipGrid}>
          {displayedSkills.map((skill) => {
            const selected = selectedSkills.includes(skill);
            return (
              <TouchableOpacity
                key={skill}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleSkill(skill)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {skill}
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
            <Text style={styles.selectedSectionLabel}>선택된 스킬 및 역할 ({selectedSkills.length})</Text>
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
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
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
  subtitle: { fontSize: 14, color: Colors.gray, lineHeight: 21, marginBottom: 16 },

  // 검색창
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
    backgroundColor: Colors.white,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.dark },
  searchClear: { fontSize: 14, color: Colors.grayMedium, paddingHorizontal: 4 },

  // 카테고리 탭
  catScroll: { marginBottom: 12 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
  },
  catChipActive: { backgroundColor: Colors.primary },
  catChipText: { fontSize: 13, color: Colors.gray, fontWeight: '500' },
  catChipTextActive: { color: Colors.white, fontWeight: '700' },

  // 섹션 라벨
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.grayMedium,
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  // 스킬 그리드
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },

  chip: {
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.ogTint,
  },
  chipText: { fontSize: 13, color: Colors.dark },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },

  chipAdd: {
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderStyle: 'dashed',
  },
  chipAddText: { fontSize: 13, color: Colors.grayMedium },

  // 선택된 스킬 섹션
  selectedSection: {
    marginTop: 20,
    paddingTop: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.ogTint,
  },
  selectedChipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  selectedChipX: { fontSize: 13, color: Colors.primary },

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
