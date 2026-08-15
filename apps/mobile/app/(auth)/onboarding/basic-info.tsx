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
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { DrumRollPicker } from '../../../src/components/common/DrumRollPicker';
import { submitBasicInfo } from '../../../src/services/onboardingService';
import { withdraw } from '../../../src/services/authService';
import { useOnboardingStore } from '../../../src/store/useOnboardingStore';
import { Alert } from '../../../src/utils/alert';
import { trackEvent, trackFbq, getSessionUtm, setUserId as setGtmUserId } from '../../../src/services/gtm';

type Gender = 'MALE' | 'FEMALE' | null;
type AgreementKey = 'required' | 'analytics';

// 약관 내용이 바뀌면 이 값만 올린다 (User.termsVersion으로 서버에 저장됨)
const TERMS_VERSION = '2026-08-15';

const REQUIRED_DETAIL_ROWS = [
  {
    label: '수집항목',
    value:
      '협업 성향 프로필(학교·학과, 참여 목적, 프로젝트 참여 시간대, 온/오프라인 선호, 보유 기술·스택), ' +
      '학력 인증 정보(재학증명서·학생증 등), 활동/평가 데이터(상호 리뷰, 열정 지수, 지원·매칭 이력)',
  },
  { label: '수집 경로', value: '온보딩/프로필 작성, 인증 절차, 서비스 이용 중 자동 생성' },
  {
    label: '목적',
    value: '팀원 매칭, 추천 알고리즘 제공, 실제 대학생/취준생 여부 확인, 신뢰 기반 커뮤니티 운영, 매칭 품질 개선',
  },
  { label: '보유기간', value: '탈퇴 시까지 (학력 인증서류는 인증 목적 달성 후 즉시 파기)' },
];

const ANALYTICS_DETAIL_ROWS = [
  {
    label: '수집항목',
    value: '서비스 이용기록·기기정보(GA4/GTM/Clarity로 수집되는 접속기록, 쿠키, 행동데이터, 세션 녹화)',
  },
  { label: '수집 경로', value: '자동 수집' },
  { label: '목적', value: '서비스 품질 개선, 이용 패턴 분석' },
  { label: '보유기간', value: '수집일로부터 1년 또는 개인정보처리방침에 명시한 기간' },
];

function AgreementItem({
  required,
  title,
  checked,
  onToggle,
  expanded,
  onToggleExpand,
  rows,
}: {
  required?: boolean;
  title: string;
  checked: boolean;
  onToggle: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  rows: { label: string; value: string }[];
}) {
  return (
    <View style={styles.agreementItem}>
      <View style={styles.agreementItemRow}>
        <TouchableOpacity style={styles.agreementItemLeft} onPress={onToggle} activeOpacity={0.7}>
          <View style={[styles.checkbox, styles.checkboxSmall, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.agreementItemText}>
            <Text style={required ? styles.badgeRequired : styles.badgeOptional}>
              {required ? '[필수] ' : '[선택] '}
            </Text>
            {title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleExpand} hitSlop={8}>
          <Text style={styles.expandArrow}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>
      {expanded && (
        <View style={styles.agreementDetail}>
          {rows.map((row) => (
            <View key={row.label} style={styles.agreementDetailRow}>
              <Text style={styles.agreementDetailLabel}>{row.label}</Text>
              <Text style={styles.agreementDetailValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function BasicInfoScreen() {
  const insets = useSafeAreaInsets();
  const setUserId = useOnboardingStore((s) => s.setUserId);
  // 로그인이 필요한 액션에서 여기까지 이어져 온 경우, 완료 후 원래 가려던 화면으로 복귀 (authGuard.ts 참고)
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const resumeHref = returnTo ? decodeURIComponent(returnTo) : '/(tabs)/home';

  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>(null);
  const [birthDate, setBirthDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);

  const [requiredAgreed, setRequiredAgreed] = useState(false);
  const [analyticsAgreed, setAnalyticsAgreed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<AgreementKey | null>(null);
  const allAgreed = requiredAgreed && analyticsAgreed;
  const toggleAllAgreed = () => {
    const next = !allAgreed;
    setRequiredAgreed(next);
    setAnalyticsAgreed(next);
  };

  const isValid =
    nickname.trim().length > 0 && name.trim().length > 0 && gender !== null && birthDate !== null && requiredAgreed;

  // 온보딩(기본 정보 입력)을 완료하지 않고 나가면 방금 로그인으로 생성된 미완성 계정을
  // 그대로 남겨두지 않고 삭제한다 — 그래야 다음에 다시 로그인할 때 새로 가입하게 된다.
  const handleExit = async () => {
    if (exiting) return;
    setExiting(true);
    try {
      await withdraw();
    } catch {
      // 네트워크 오류 등으로 삭제에 실패해도 로그인 화면 이동은 막지 않음
    } finally {
      // withdraw() API 성공 여부와 무관하게 화면 이동은 항상 진행되므로(위 catch 참고)
      // 이벤트도 동일하게 무조건 보낸다. 계정 정리를 위한 withdraw API를 재사용할 뿐,
      // 정착한 유저의 회원 탈퇴(useAuthStore.logout('withdraw'))와는 다른 의미라 이름을 분리한다.
      trackEvent('sign_up_abandon');
      router.replace(`/(auth)/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}` as never);
    }
  };

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
        termsVersion: TERMS_VERSION,
        analyticsOptIn: analyticsAgreed,
      });
      setUserId(userId);
      setGtmUserId(userId);
      trackEvent('sign_up', getSessionUtm());
      trackFbq('CompleteRegistration');
      router.replace(resumeHref as never);
    } catch (e) {
      Alert.alert('오류', e instanceof Error ? e.message : '저장에 실패했어요. 다시 시도해주세요.');
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
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleExit} style={styles.backBtn} disabled={exiting}>
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

          {/* 약관 동의 */}
          <View style={styles.agreementSection}>
            <TouchableOpacity style={styles.agreementAllRow} onPress={toggleAllAgreed} activeOpacity={0.7}>
              <View style={[styles.checkbox, allAgreed && styles.checkboxChecked]}>
                {allAgreed && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={styles.agreementAllText}>전체 동의합니다</Text>
            </TouchableOpacity>

            <View style={styles.agreementDivider} />

            <AgreementItem
              required
              title="서비스 이용약관 및 개인정보 수집·이용 동의"
              checked={requiredAgreed}
              onToggle={() => setRequiredAgreed((v) => !v)}
              expanded={expandedItem === 'required'}
              onToggleExpand={() => setExpandedItem((k) => (k === 'required' ? null : 'required'))}
              rows={REQUIRED_DETAIL_ROWS}
            />
            <AgreementItem
              title="서비스 이용기록·기기정보 수집 동의 (분석 목적)"
              checked={analyticsAgreed}
              onToggle={() => setAnalyticsAgreed((v) => !v)}
              expanded={expandedItem === 'analytics'}
              onToggleExpand={() => setExpandedItem((k) => (k === 'analytics' ? null : 'analytics'))}
              rows={ANALYTICS_DETAIL_ROWS}
            />
          </View>
        </ScrollView>

        {/* 시작하기 버튼 */}
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
            <Text style={[styles.nextText, !isValid && styles.nextTextDisabled]}>시작하기</Text>
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
  agreementSection: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    overflow: 'hidden',
  },
  agreementAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.pageBg,
  },
  agreementAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginLeft: 10,
  },
  agreementDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxSmall: {
    width: 18,
    height: 18,
    borderRadius: 5,
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxMark: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  agreementItem: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  agreementItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  agreementItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  agreementItemText: {
    fontSize: 13,
    color: Colors.dark,
    marginLeft: 10,
    flexShrink: 1,
  },
  badgeRequired: {
    fontWeight: '700',
    color: Colors.primary,
  },
  badgeOptional: {
    fontWeight: '700',
    color: Colors.gray,
  },
  expandArrow: {
    fontSize: 11,
    color: Colors.grayMedium,
  },
  agreementDetail: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  agreementDetailRow: {
    gap: 2,
  },
  agreementDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.grayMedium,
  },
  agreementDetailValue: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 17,
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
