import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { DrumRollPicker } from '../../../src/components/common/DrumRollPicker';
import { submitBasicInfo } from '../../../src/services/onboardingService';
import { useOnboardingStore } from '../../../src/store/useOnboardingStore';

type Gender = 'MALE' | 'FEMALE' | null;

export default function BasicInfoScreen() {
  const insets = useSafeAreaInsets();
  const setUserId = useOnboardingStore((s) => s.setUserId);

  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>(null);
  const [birthDate, setBirthDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = nickname.trim().length > 0 && name.trim().length > 0 && gender !== null && birthDate !== null;

  const formatBirthDate = () => {
    if (!birthDate) return '';
    return `${birthDate.year}년 ${birthDate.month}월 ${birthDate.day}일`;
  };

  const toBirthDateString = (): string => {
    if (!birthDate) return '';
    const mm = String(birthDate.month).padStart(2, '0');
    const dd = String(birthDate.day).padStart(2, '0');
    return `${birthDate.year}-${mm}-${dd}`;
  };

  const handleNext = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const userId = await submitBasicInfo({
        nickname: nickname.trim(),
        name: name.trim(),
        gender: gender!,
        birthDate: toBirthDateString(),
      });
      setUserId(userId);
      router.push('/(auth)/onboarding/region');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 상단 진행바 */}
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.progressActive]} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>

        {/* 헤더 — education.tsx / region.tsx 와 동일한 구조 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>기본 정보</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>반가워요! 당신에 대해 알려주세요</Text>
          <Text style={styles.subtitle}>공모전 매칭을 위해 기본 정보를 입력해 주세요</Text>

          {/* 닉네임 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>닉네임 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="사용할 닉네임을 입력하세요"
              placeholderTextColor="#BBBBBB"
              value={nickname}
              onChangeText={setNickname}
              maxLength={20}
            />
          </View>

          {/* 이름 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>이름 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="본명을 입력하세요"
              placeholderTextColor="#BBBBBB"
              value={name}
              onChangeText={setName}
              maxLength={10}
            />
          </View>

          {/* 성별 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>성별 <Text style={styles.required}>*</Text></Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'MALE' && styles.genderBtnActive]}
                onPress={() => setGender('MALE')}
              >
                <Text style={[styles.genderText, gender === 'MALE' && styles.genderTextActive]}>남성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'FEMALE' && styles.genderBtnActive]}
                onPress={() => setGender('FEMALE')}
              >
                <Text style={[styles.genderText, gender === 'FEMALE' && styles.genderTextActive]}>여성</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 생년월일 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>생년월일 <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={[styles.input, styles.dateField]}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateText, !birthDate && styles.placeholder]}>
                {birthDate ? formatBirthDate() : '생년월일을 입력해주세요'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* 다음으로 버튼 — education.tsx 와 동일한 위치/패턴 */}
        <View style={[
          styles.bottomArea,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) },
        ]}>
          <TouchableOpacity
            style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextText, !isValid && styles.nextTextDisabled]}>다음으로</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 드럼롤 피커 */}
      <DrumRollPicker
        visible={showPicker}
        initialYear={birthDate?.year ?? 2000}
        initialMonth={birthDate?.month ?? 1}
        initialDay={birthDate?.day ?? 1}
        onConfirm={(year, month, day) => {
          setBirthDate({ year, month, day });
          setShowPicker(false);
        }}
        onCancel={() => setShowPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  progressBar: {
    flexDirection: 'row',
    height: 3,
  },
  progressStep: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  progressActive: {
    backgroundColor: Colors.primary,
  },
  // education.tsx / region.tsx 와 완전히 동일한 헤더 스타일
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
    color: Colors.dark,
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 6,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 28,
    lineHeight: 19,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  required: {
    color: Colors.primary,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.dark,
    backgroundColor: Colors.white,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  genderBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.gray,
  },
  genderTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  dateField: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 15,
    color: Colors.dark,
  },
  placeholder: {
    color: '#BBBBBB',
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  nextBtn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: Colors.lightGray,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  nextTextDisabled: {
    color: Colors.gray,
  },
});
