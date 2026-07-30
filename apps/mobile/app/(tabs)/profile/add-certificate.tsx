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
import { addCertificateCareer, updateCertificateCareer } from '../../../src/services/mypageService';
import { trackEvent } from '../../../src/services/gtm';

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

export default function AddCertificateScreen() {
  const insets = useSafeAreaInsets();
  const { addCareerLocal, updateCareerLocal } = useMypageStore();
  const params = useLocalSearchParams<{
    careerItemId?: string;
    certName?: string;
    issuingOrg?: string;
    acquiredDate?: string;
  }>();
  const isEditMode = !!params.careerItemId;

  const [certName, setCertName] = useState(params.certName ?? '');
  const [issuingOrg, setIssuingOrg] = useState(params.issuingOrg ?? '');
  const [acquiredDate, setAcquiredDate] = useState(params.acquiredDate || '2024-01-01');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateParsed = parseDate(acquiredDate);

  const handleSave = async () => {
    if (!certName.trim()) {
      Alert.alert('입력 오류', '자격증 이름을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const data = {
        certName: certName.trim(),
        issuingOrg: issuingOrg.trim(),
        acquiredDate,
      };
      if (isEditMode) {
        const result = await updateCertificateCareer(Number(params.careerItemId), data);
        updateCareerLocal(result);
        Alert.alert('수정 완료', '자격증이 수정되었어요.', [
          { text: '확인', onPress: () => router.back() },
        ]);
      } else {
        const result = await addCertificateCareer(data);
        addCareerLocal(result);
        trackEvent('career_add', { item_type: 'certificate' });
        Alert.alert('등록 완료', '자격증이 등록되었어요.', [
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
      <ScreenHeader title={isEditMode ? '자격증 수정' : '자격증 추가'} onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* 자격증 이름 */}
        <View style={styles.section}>
          <Text style={styles.label}>자격증 이름 *</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 정보처리기사, SQLD"
            placeholderTextColor={Colors.grayMedium}
            value={certName}
            onChangeText={setCertName}
            maxLength={80}
          />
        </View>

        {/* 발급 기관 */}
        <View style={styles.section}>
          <Text style={styles.label}>발급 기관</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 한국산업인력공단"
            placeholderTextColor={Colors.grayMedium}
            value={issuingOrg}
            onChangeText={setIssuingOrg}
            maxLength={80}
          />
        </View>

        {/* 취득일 */}
        <View style={styles.section}>
          <Text style={styles.label}>취득일</Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateBtnText}>{acquiredDate}</Text>
            <Text style={styles.dateBtnArrow}>›</Text>
          </TouchableOpacity>
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

      <DrumRollPicker
        visible={showDatePicker}
        title="취득일 선택"
        subtitle="자격증 취득 날짜를 선택하세요"
        initialYear={dateParsed.year}
        initialMonth={dateParsed.month}
        initialDay={dateParsed.day}
        onConfirm={(year, month, day) => {
          setAcquiredDate(formatDate(year, month, day ?? 1));
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
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

  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.pageBg,
  },
  dateBtnText: { fontSize: 14, color: Colors.dark },
  dateBtnArrow: { fontSize: 18, color: Colors.grayMedium },

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
