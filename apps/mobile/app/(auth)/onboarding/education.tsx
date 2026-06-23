import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../src/constants/colors';
import { SearchBottomSheet } from '../../../src/components/common/SearchBottomSheet';
import { SCHOOL_LIST, MAJOR_LIST } from '../../../src/data/schools';
import { submitEducation } from '../../../src/services/onboardingService';
import { useOnboardingStore } from '../../../src/store/useOnboardingStore';
import { tokenStorage } from '../../../src/services/tokenStorage';

type EducationStatus = 'ATTENDING' | 'COMPLETED' | 'EXPECTED' | 'GRADUATED';

const STATUS_LABELS: { key: EducationStatus; label: string }[] = [
  { key: 'ATTENDING', label: '재학' },
  { key: 'COMPLETED', label: '수료' },
  { key: 'EXPECTED', label: '졸업예정' },
  { key: 'GRADUATED', label: '졸업' },
];

export default function EducationScreen() {
  const insets = useSafeAreaInsets();
  const userId = useOnboardingStore((s) => s.userId);

  const [schoolName, setSchoolName] = useState('');
  const [status, setStatus] = useState<EducationStatus | null>(null);
  const [major, setMajor] = useState('');
  const [subMajor, setSubMajor] = useState('');
  const [loading, setLoading] = useState(false);

  const [showSchoolSheet, setShowSchoolSheet] = useState(false);
  const [showMajorSheet, setShowMajorSheet] = useState(false);
  const [showSubMajorSheet, setShowSubMajorSheet] = useState(false);

  const isValid = schoolName.length > 0 && status !== null;

  const handleNext = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await submitEducation(userId ?? 1, {
        schoolName,
        status: status!,
        majorType: subMajor ? 'DOUBLE' : 'SINGLE',
        major: major || '',
        subMajor: subMajor || null,
      });
      await tokenStorage.setOnboardingComplete();
      router.replace('/(tabs)/home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 진행바 */}
      <View style={styles.progressBar}>
        <View style={[styles.progressStep, styles.progressActive]} />
        <View style={[styles.progressStep, styles.progressActive]} />
        <View style={[styles.progressStep, styles.progressActive]} />
      </View>

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>학력 정보</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>학력을 입력해 주세요</Text>
        <Text style={styles.subtitle}>기본 정보 다음으로 학력 및 전공을 알려주세요</Text>

        {/* 학교 검색 */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>학교 검색 <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.searchField, schoolName ? styles.searchFieldFilled : styles.searchFieldEmpty]}
            onPress={() => setShowSchoolSheet(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={[styles.searchText, !schoolName && styles.placeholder]}>
              {schoolName || '학교 이름을 검색하세요'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 재학 상태 */}
        <View style={styles.fieldGroup}>
          <View style={styles.statusRow}>
            {STATUS_LABELS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.statusBtn, status === key && styles.statusBtnActive]}
                onPress={() => setStatus(key)}
              >
                <Text style={[styles.statusText, status === key && styles.statusTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 학과 정보 */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            학과 정보 <Text style={styles.optional}>(선택)</Text>
          </Text>

          {/* 주전공 */}
          <Text style={styles.subLabel}>주전공</Text>
          <TouchableOpacity
            style={[styles.majorField, { marginBottom: 14 }]}
            onPress={() => setShowMajorSheet(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.majorText, !major && styles.placeholder]}>
              {major || '전공을 검색하세요'}
            </Text>
          </TouchableOpacity>

          {/* 복수전공 */}
          <Text style={styles.subLabel}>복수전공</Text>
          {subMajor ? (
            <TouchableOpacity
              style={styles.majorField}
              onPress={() => setShowSubMajorSheet(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.majorText}>{subMajor}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addSubMajorBtn}
              onPress={() => setShowSubMajorSheet(true)}
            >
              <Text style={styles.addSubMajorText}>복수전공 추가</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 인증 안내 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>🏫  학교 인증은 마이페이지에서 가능합니다</Text>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) }]}>
        <TouchableOpacity style={styles.prevBtn} onPress={() => router.back()}>
          <Text style={styles.prevText}>이전</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextText, !isValid && styles.nextTextDisabled]}>다음으로</Text>
        </TouchableOpacity>
      </View>

      {/* 학교 검색 바텀시트 */}
      <SearchBottomSheet
        visible={showSchoolSheet}
        title="학교 검색"
        placeholder="학교 이름을 검색하세요"
        items={SCHOOL_LIST}
        onSelect={(item) => { setSchoolName(item); setShowSchoolSheet(false); }}
        onClose={() => setShowSchoolSheet(false)}
      />

      {/* 주전공 검색 바텀시트 */}
      <SearchBottomSheet
        visible={showMajorSheet}
        title="학과 검색"
        placeholder="학과 이름을 검색하세요"
        items={MAJOR_LIST}
        onSelect={(item) => { setMajor(item); setShowMajorSheet(false); }}
        onClose={() => setShowMajorSheet(false)}
        allowCustomInput
      />

      {/* 복수전공 검색 바텀시트 */}
      <SearchBottomSheet
        visible={showSubMajorSheet}
        title="복수전공 검색"
        placeholder="학과 이름을 검색하세요"
        items={MAJOR_LIST}
        onSelect={(item) => { setSubMajor(item); setShowSubMajorSheet(false); }}
        onClose={() => setShowSubMajorSheet(false)}
        allowCustomInput
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressBar: {
    flexDirection: 'row',
    height: 3,
  },
  progressStep: {
    flex: 1,
    backgroundColor: '#EEEEEE',
  },
  progressActive: {
    backgroundColor: Colors.primary,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 28,
    color: '#1A1A1A',
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 28,
    lineHeight: 19,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  required: {
    color: Colors.primary,
  },
  optional: {
    color: '#AAAAAA',
    fontWeight: '400',
    fontSize: 13,
  },
  subLabel: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 7,
    fontWeight: '500',
  },
  searchField: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchFieldEmpty: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  searchFieldFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    fontSize: 16,
  },
  searchText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  placeholder: {
    color: '#BBBBBB',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statusBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  majorField: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  majorText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  addSubMajorBtn: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  addSubMajorText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#999999',
    lineHeight: 18,
  },
  bottomArea: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  prevBtn: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  prevText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
  },
  nextBtn: {
    flex: 2,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextTextDisabled: {
    color: '#AAAAAA',
  },
});
