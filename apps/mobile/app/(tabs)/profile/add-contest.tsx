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
import { Alert } from '../../../src/utils/alert';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { DrumRollPicker } from '../../../src/components/common/DrumRollPicker';
import { useMypageStore } from '../../../src/store/useMypageStore';
import { addContestCareer, updateContestCareer } from '../../../src/services/mypageService';
import { AwardStatus } from '../../../src/types/mypage';

const ROLES = [
  '기획',
  'PM',
  '디자인',
  '프론트엔드',
  '백엔드',
  'AI',
  '데이터 분석',
  '마케팅',
];

const AWARD_OPTIONS: { value: AwardStatus; label: string }[] = [
  { value: 'AWARDED', label: '수상' },
  { value: 'NOT_AWARDED', label: '미수상' },
];

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return { year: y || 2024, month: m || 1, day: d || 1 };
}

export default function AddContestScreen() {
  const insets = useSafeAreaInsets();
  const { addCareerLocal, updateCareerLocal } = useMypageStore();
  const params = useLocalSearchParams<{
    careerItemId?: string;
    contestName?: string;
    roles?: string;
    startDate?: string;
    endDate?: string;
    awardStatus?: AwardStatus;
  }>();
  const isEditMode = !!params.careerItemId;

  const [contestName, setContestName] = useState(params.contestName ?? '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    params.roles ? params.roles.split(',') : [],
  );
  const [startDate, setStartDate] = useState(params.startDate || '2024-01-01');
  const [endDate, setEndDate] = useState(params.endDate || '2024-06-30');
  const [awardStatus, setAwardStatus] = useState<AwardStatus>(params.awardStatus ?? 'NOT_AWARDED');
  const [saving, setSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showCustomRoleInput, setShowCustomRoleInput] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');

  const startParsed = parseDate(startDate);
  const endParsed = parseDate(endDate);
  const customSelectedRoles = selectedRoles.filter((r) => !ROLES.includes(r));

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleAddCustomRole = () => {
    const trimmed = customRoleText.trim();
    if (!trimmed) return;
    if (!selectedRoles.includes(trimmed)) {
      setSelectedRoles((prev) => [...prev, trimmed]);
    }
    setCustomRoleText('');
    setShowCustomRoleInput(false);
  };

  const handleSave = async () => {
    if (!contestName.trim()) {
      Alert.alert('입력 오류', '공모전 이름을 입력해주세요.');
      return;
    }
    if (selectedRoles.length === 0) {
      Alert.alert('입력 오류', '역할을 하나 이상 선택해주세요.');
      return;
    }

    setSaving(true);
    try {
      const data = {
        contestName: contestName.trim(),
        roles: selectedRoles,
        startDate,
        endDate,
        awardStatus,
      };
      if (isEditMode) {
        const result = await updateContestCareer(Number(params.careerItemId), data);
        updateCareerLocal(result);
        Alert.alert('수정 완료', '공모전 경험이 수정되었어요.', [
          { text: '확인', onPress: () => router.back() },
        ]);
      } else {
        const result = await addContestCareer(data);
        addCareerLocal(result);
        Alert.alert('등록 완료', '공모전 경험이 등록되었어요.', [
          { text: '확인', onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert('오류', `${isEditMode ? '수정' : '등록'}에 실패했어요. 다시 시도해주세요.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={isEditMode ? '공모전 수정' : '공모전 추가'} onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* 공모전 이름 */}
        <View style={styles.section}>
          <Text style={styles.label}>공모전 이름 *</Text>
          <TextInput
            style={styles.input}
            placeholder="공모전 이름을 입력해주세요"
            placeholderTextColor={Colors.grayMedium}
            value={contestName}
            onChangeText={setContestName}
            maxLength={100}
          />
        </View>

        {/* 역할 */}
        <View style={styles.section}>
          <Text style={styles.label}>역할 * (복수 선택 가능)</Text>
          <View style={styles.chipGrid}>
            {ROLES.map((role) => {
              const selected = selectedRoles.includes(role);
              return (
                <TouchableOpacity
                  key={role}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleRole(role)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {role}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {customSelectedRoles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.chip, styles.chipSelected]}
                onPress={() => toggleRole(role)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, styles.chipTextSelected]}>{role} ✕</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.chip, showCustomRoleInput && styles.chipSelected]}
              onPress={() => setShowCustomRoleInput((v) => !v)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.chipText, showCustomRoleInput && styles.chipTextSelected]}
              >
                ✏ 직접 입력하기
              </Text>
            </TouchableOpacity>
          </View>

          {showCustomRoleInput && (
            <View style={styles.customRoleRow}>
              <TextInput
                style={styles.customRoleInput}
                placeholder="역할명을 입력하세요"
                placeholderTextColor={Colors.grayMedium}
                value={customRoleText}
                onChangeText={setCustomRoleText}
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={handleAddCustomRole}
                autoFocus
              />
              <TouchableOpacity
                style={styles.customRoleAddBtn}
                onPress={handleAddCustomRole}
                activeOpacity={0.7}
              >
                <Text style={styles.customRoleAddBtnText}>추가</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 활동 기간 */}
        <View style={styles.section}>
          <Text style={styles.label}>공모전 활동 기간</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateBtnText}>{startDate}</Text>
            </TouchableOpacity>
            <Text style={styles.dateSep}>~</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateBtnText}>{endDate}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 수상 여부 */}
        <View style={styles.section}>
          <Text style={styles.label}>수상 여부</Text>
          <View style={styles.awardRow}>
            {AWARD_OPTIONS.map((opt) => {
              const selected = awardStatus === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.awardBtn, selected && styles.awardBtnSelected]}
                  onPress={() => setAwardStatus(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.awardBtnText,
                      selected && styles.awardBtnTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? '저장 중...' : isEditMode ? '수정하기' : '저장하기'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 시작 날짜 피커 */}
      <DrumRollPicker
        visible={showStartPicker}
        title="시작 날짜 선택"
        subtitle="공모전 참여 시작일을 선택하세요"
        initialYear={startParsed.year}
        initialMonth={startParsed.month}
        initialDay={startParsed.day}
        onConfirm={(year, month, day) => {
          setStartDate(formatDate(year, month, day));
          setShowStartPicker(false);
        }}
        onCancel={() => setShowStartPicker(false)}
      />

      {/* 종료 날짜 피커 */}
      <DrumRollPicker
        visible={showEndPicker}
        title="종료 날짜 선택"
        subtitle="공모전 참여 종료일을 선택하세요"
        initialYear={endParsed.year}
        initialMonth={endParsed.month}
        initialDay={endParsed.day}
        onConfirm={(year, month, day) => {
          setEndDate(formatDate(year, month, day));
          setShowEndPicker(false);
        }}
        onCancel={() => setShowEndPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  content: { paddingBottom: 32 },

  section: {
    backgroundColor: Colors.white,
    marginTop: 8,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.pageBg,
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.ogTint,
  },
  chipText: { fontSize: 13, color: Colors.gray },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },

  customRoleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  customRoleInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.pageBg,
  },
  customRoleAddBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customRoleAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateSep: { fontSize: 16, color: Colors.gray },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
  },
  dateBtnText: { fontSize: 14, color: Colors.dark, fontWeight: '500' },

  awardRow: { flexDirection: 'row', gap: 10 },
  awardBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  awardBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  awardBtnText: { fontSize: 14, color: Colors.gray },
  awardBtnTextSelected: { color: Colors.white, fontWeight: '700' },

  footer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
