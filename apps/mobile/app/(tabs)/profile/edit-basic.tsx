import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from '../../../src/utils/alert';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { DrumRollPicker } from '../../../src/components/common/DrumRollPicker';
import { useMypageStore } from '../../../src/store/useMypageStore';
import { updateMyProfile } from '../../../src/services/mypageService';
import { Gender, VerificationStatus } from '../../../src/types/mypage';
import { EDUCATION_STATUS_LABEL } from '../../../src/constants/education';

// ──────────────────────────────────────────────────
// FormField: label 위, 입력/선택 아래
// ──────────────────────────────────────────────────
function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

// ──────────────────────────────────────────────────
// CertSection: 학력 인증 상태 카드
// ──────────────────────────────────────────────────
function CertSection({ certStatus }: { certStatus: VerificationStatus }) {
  return (
    <View style={styles.certSection}>
      <View style={styles.certHeader}>
        <Text style={styles.certHeaderIcon}>🪪</Text>
        <View style={styles.certHeaderText}>
          <Text style={styles.certTitle}>학력 인증</Text>
          <Text style={styles.certDesc}>학생증 또는 재학증명서로 인증해요</Text>
        </View>
      </View>

      <View style={styles.certRow}>
        {/* 왼쪽: 상태 텍스트 */}
        <View style={styles.certLeft}>
          {certStatus === 'PENDING' && (
            <Text style={styles.certPending}>🔵 심사 중</Text>
          )}
          {certStatus === 'REJECTED' && (
            <Text style={styles.certRejected}>❌ 인증 실패</Text>
          )}
          {certStatus === 'APPROVED' && (
            <Text style={styles.certApproved}>✅ 인증 완료</Text>
          )}
        </View>

        {/* 오른쪽: 버튼 */}
        {certStatus === 'APPROVED' ? (
          <View style={styles.certBtnGroup}>
            <View style={styles.certBtnDone}>
              <Text style={styles.certBtnDoneText}>인증 완료</Text>
            </View>
            <TouchableOpacity
              style={styles.certEditBtn}
              onPress={() =>
                router.push('/(tabs)/profile/education?mode=edit' as never)
              }
              activeOpacity={0.7}
            >
              <Text style={styles.certEditBtnText}>수정하기</Text>
            </TouchableOpacity>
          </View>
        ) : certStatus === 'PENDING' ? (
          <View style={styles.certBtnDisabled}>
            <Text style={styles.certBtnDisabledText}>심사 중</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.certBtn}
            onPress={() => router.push('/(tabs)/profile/education')}
            activeOpacity={0.7}
          >
            <Text style={styles.certBtnText}>
              {certStatus === 'REJECTED' ? '다시 인증' : '인증하기'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────────
export default function EditBasicScreen() {
  const insets = useSafeAreaInsets();
  const { profile, reloadProfile } = useMypageStore();
  const { returnTo, contestId } = useLocalSearchParams<{ returnTo?: string; contestId?: string }>();

  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // profile이 최초로 로드될 때 한 번만 폼을 채운다.
  // 이후 다른 화면(학력 수정 등)에서 store의 profile이 갱신되어도
  // 이 화면에서 입력 중인(아직 저장 전인) 값은 덮어쓰지 않는다.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (profile && !initializedRef.current) {
      setNickname(profile.nickname);
      setName(profile.name);
      setGender(profile.gender);
      setBirthDate(profile.birthDate ?? '');
      initializedRef.current = true;
    }
  }, [profile]);

  // 생년월일 파싱
  const birthParts = birthDate.split('-');
  const birthYear = parseInt(birthParts[0] ?? '2000', 10);
  const birthMonth = parseInt(birthParts[1] ?? '1', 10);
  const birthDay = parseInt(birthParts[2] ?? '1', 10);

  // 학력 표시 레이블
  const educationLabel = profile?.education
    ? `${profile.education.schoolName} ${profile.education.major} · ${EDUCATION_STATUS_LABEL[profile.education.status]}`
    : '';

  // 인증 상태
  const certStatus: VerificationStatus =
    profile?.education?.verificationStatus ?? 'NONE';

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }
    if (!birthDate) {
      Alert.alert('알림', '생년월일을 선택해주세요.');
      return;
    }
    setLoading(true);
    try {
      await updateMyProfile({
        nickname: nickname.trim(),
        name: name.trim(),
        gender,
        birthDate,
      });
      await reloadProfile();
      if (returnTo === 'participate') {
        router.replace(`/explore/participate?contestId=${contestId}` as never);
      } else if (returnTo === 'build-team') {
        router.replace(`/explore/build-team/${contestId}` as never);
      } else {
        router.back();
      }
    } catch (e) {
      Alert.alert('오류', e instanceof Error ? e.message : '저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="기본 정보" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── 닉네임 ── */}
        <FormField label="닉네임" required>
          <TextInput
            style={styles.inputBox}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임 입력"
            placeholderTextColor={Colors.grayMedium}
            maxLength={20}
            returnKeyType="next"
          />
        </FormField>

        {/* ── 이름 ── */}
        <FormField label="이름" required>
          <TextInput
            style={styles.inputBox}
            value={name}
            onChangeText={setName}
            placeholder="이름 입력"
            placeholderTextColor={Colors.grayMedium}
            maxLength={20}
            returnKeyType="done"
          />
        </FormField>

        {/* ── 성별 ── */}
        <FormField label="성별" required>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setShowGenderPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.selectText}>{gender === 'MALE' ? '남성' : '여성'}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </FormField>

        {/* ── 생년월일 ── */}
        <FormField label="생년월일" required>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectText,
                !birthDate && styles.placeholderText,
              ]}
            >
              {birthDate ? birthDate.replace(/-/g, '.') : '선택해주세요'}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </FormField>

        {/* ── 학력 ── */}
        <FormField label="학력">
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() =>
              router.push(
                educationLabel
                  ? ('/(tabs)/profile/education?mode=edit' as never)
                  : ('/(tabs)/profile/education' as never)
              )
            }
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectText,
                !educationLabel && styles.placeholderText,
              ]}
            >
              {educationLabel || '학교 검색하기'}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </FormField>

        {/* ── 학력 인증 섹션 ── */}
        <CertSection certStatus={certStatus} />
      </ScrollView>

      {/* ── 저장 버튼 ── */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {loading ? '저장 중...' : '저장하기'}
          </Text>
        </TouchableOpacity>
      </View>


      {/* ── 생년월일 드럼롤 ── */}
      <DrumRollPicker
        visible={showDatePicker}
        initialYear={birthYear}
        initialMonth={birthMonth}
        initialDay={birthDay}
        onConfirm={(y, m, d) => {
          const dd = d ?? 1;
          setBirthDate(
            `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
          );
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />


      {/* ── 성별 선택 모달 ── */}
      <Modal visible={showGenderPicker} transparent animationType="fade">
        <View style={styles.genderModalBackdrop}>
          <View style={styles.genderModalSheet}>
            <Text style={styles.genderModalTitle}>성별 선택</Text>
            {(['MALE', 'FEMALE'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={styles.genderModalRow}
                onPress={() => setGender(g)}
                activeOpacity={0.7}
              >
                <View style={[styles.genderRadio, gender === g && styles.genderRadioActive]}>
                  {gender === g && <View style={styles.genderRadioDot} />}
                </View>
                <Text style={styles.genderModalRowText}>{g === 'MALE' ? '남성' : '여성'}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.genderModalSaveBtn}
              onPress={() => setShowGenderPicker(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.genderModalSaveBtnText}>저장하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ──────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ── 폼 필드 ──
  field: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: Colors.white,
  },
  fieldLabel: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: Colors.primary,
  },
  inputBox: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.dark,
    marginBottom: 12,
    backgroundColor: Colors.white,
  },
  selectBox: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: Colors.white,
  },
  selectText: {
    fontSize: 15,
    color: Colors.dark,
    flex: 1,
  },
  placeholderText: {
    color: Colors.grayMedium,
  },
  chevron: {
    fontSize: 20,
    color: Colors.grayMedium,
  },

  // ── 성별 선택 모달 ──
  genderModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  genderModalSheet: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  genderModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 16,
  },
  genderModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  genderModalRowText: {
    fontSize: 15,
    color: Colors.dark,
    fontWeight: '500',
  },
  genderRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  genderRadioActive: {
    borderColor: Colors.primary,
  },
  genderRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  genderModalSaveBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  genderModalSaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },

  // ── 학력 인증 섹션 ──
  certSection: {
    marginTop: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  certHeaderIcon: {
    fontSize: 20,
  },
  certHeaderText: {
    flex: 1,
  },
  certTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 2,
  },
  certDesc: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certLeft: {
    flex: 1,
    marginRight: 8,
  },
  certPending: {
    fontSize: 13,
    color: '#1565C0',
    fontWeight: '600',
  },
  certRejected: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
  },
  certApproved: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },

  // NONE / REJECTED
  certBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },

  // APPROVED
  certBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  certBtnDone: {
    width: 76,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certBtnDoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray,
  },
  certEditBtn: {
    width: 76,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certEditBtnText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },

  // PENDING
  certBtnDisabled: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certBtnDisabledText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.grayMedium,
  },

  // ── 푸터 ──
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  saveBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
