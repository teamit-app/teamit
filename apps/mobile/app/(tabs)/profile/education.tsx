import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Alert } from '../../../src/utils/alert';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { SearchBottomSheet } from '../../../src/components/common/SearchBottomSheet';
import { useMypageStore } from '../../../src/store/useMypageStore';
import { SCHOOL_LIST } from '../../../src/data/schools';
import { MAJOR_LIST } from '../../../src/data/majors';
import { EducationStatus, VerificationStatus } from '../../../src/types/mypage';
import { submitEducation } from '../../../src/services/onboardingService';
import { cancelEducationCert } from '../../../src/services/mypageService';

// ──────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────
const STATUS_OPTIONS: { key: EducationStatus; label: string }[] = [
  { key: 'ATTENDING', label: '재학' },
  { key: 'LEAVE', label: '휴학' },
  { key: 'COMPLETED', label: '수료/졸업유예' },
  { key: 'GRADUATED', label: '졸업' },
];

// ──────────────────────────────────────────────────
// CertStatusCard: verificationStatus별 카드
// ──────────────────────────────────────────────────
function CertStatusCard({
  verificationStatus,
  verificationFileName,
  verificationRejectReason,
  schoolName,
  verificationSubmittedAt,
  onCancelSubmission,
}: {
  verificationStatus: VerificationStatus;
  verificationFileName?: string;
  verificationRejectReason?: string | null;
  schoolName: string;
  verificationSubmittedAt?: string;
  onCancelSubmission: () => void;
}) {
  if (verificationStatus === 'NONE') {
    return (
      <View style={styles.certStatusCard}>
        {/* 미인증 상태 칩 */}
        <View style={styles.statusChipRow}>
          <View style={styles.statusChipGray}>
            <Text style={styles.statusChipGrayText}>🔓 미인증</Text>
          </View>
        </View>

        {/* 경고 박스 */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>아직 학교 인증이 완료되지 않았어요</Text>
          <Text style={styles.warningDesc}>
            * 인증하면 프로필에 뱃지가 표시되고 매칭 신뢰도가 높아져요
          </Text>
        </View>
      </View>
    );
  }

  if (verificationStatus === 'PENDING') {
    return (
      <View style={styles.certStatusCard}>
        <View style={styles.statusCardGreen}>
          <Text style={styles.statusCardGreenText}>🔍 현재 상태: 심사 중</Text>
          <Text style={styles.statusCardDesc}>
            운영팀이 서류를 검토하고 있어요. 보통 1~2일 내로 결과를 알려드려요
          </Text>
        </View>
        {verificationFileName ? (
          <View style={styles.submittedFileRow}>
            <Text style={styles.submittedFileIcon}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.submittedFileName}>{verificationFileName}</Text>
              {verificationSubmittedAt ? (
                <Text style={styles.submittedFileDate}>{verificationSubmittedAt} 제출</Text>
              ) : null}
              <TouchableOpacity
                style={styles.cancelSubmitBtn}
                onPress={onCancelSubmission}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelSubmitBtnText}>제출 취소하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  if (verificationStatus === 'APPROVED') {
    return (
      <View style={styles.certStatusCard}>
        <View style={styles.statusCardGreen}>
          <Text style={styles.statusCardGreenText}>✅ 현재 상태: 인증 완료</Text>
          <Text style={styles.statusCardDescBold}>{schoolName} 인증 완료</Text>
          {verificationSubmittedAt ? (
            <Text style={styles.statusCardDesc}>
              제출일: {verificationSubmittedAt}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  // REJECTED
  return (
    <View style={styles.certStatusCard}>
      <View style={styles.statusCardRed}>
        <Text style={styles.statusCardRedText}>❌ 인증 실패</Text>
        <Text style={styles.statusCardDesc}>서류 내용이 확인되지 않았어요</Text>
        <View style={styles.rejectReasonBox}>
          <Text style={styles.rejectReasonTitle}>반려 사유</Text>
          {verificationRejectReason ? (
            <Text style={styles.rejectReason}>· {verificationRejectReason}</Text>
          ) : (
            <Text style={styles.rejectReason}>
              · 제출하신 이미지의 해상도가 낮아 정보 확인이 어려워요
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────────
export default function EducationScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateEducationLocal } = useMypageStore();

  const [schoolName, setSchoolName] = useState('');
  const [educationStatus, setEducationStatus] =
    useState<EducationStatus>('ATTENDING');
  const [major, setMajor] = useState('');
  const [subMajor, setSubMajor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showSchoolSearch, setShowSchoolSearch] = useState(false);
  const [showMajorSearch, setShowMajorSearch] = useState(false);
  const [showSubMajorSearch, setShowSubMajorSearch] = useState(false);

  const verificationStatus: VerificationStatus =
    profile?.education?.verificationStatus ?? 'NONE';

  // profile이 최초로 로드될 때 한 번만 폼을 채운다 (입력 중인 값이 덮어써지지 않도록).
  const initializedRef = useRef(false);
  useEffect(() => {
    if (profile?.education && !initializedRef.current) {
      setSchoolName(profile.education.schoolName);
      setEducationStatus(profile.education.status);
      setMajor(profile.education.major);
      setSubMajor(profile.education.subMajor ?? null);
      initializedRef.current = true;
    }
  }, [profile]);

  // 저장 후 이동할 곳: 'back' = 저장하기 버튼, 'cert' = 파일 업로드 버튼(저장 후 바로 인증 화면으로)
  const trySave = (nextAction: 'back' | 'cert') => {
    if (!schoolName.trim()) {
      Alert.alert('알림', '학교명을 입력해주세요.');
      return;
    }

    const schoolChanged = profile?.education?.schoolName !== schoolName.trim();
    const majorChanged = (profile?.education?.major ?? '') !== (major || '');
    const subMajorChanged = (profile?.education?.subMajor ?? null) !== (subMajor || null);
    const willResetVerification =
      (schoolChanged || majorChanged || subMajorChanged) && verificationStatus !== 'NONE';

    if (willResetVerification) {
      Alert.alert(
        '학력 정보 변경 안내',
        '신입학·편입·전과·복수전공 추가 등으로 학교 또는 전공 정보가 바뀌면 기존 인증 뱃지가 사라지고 다시 인증을 받아야 해요. 계속하시겠어요?',
        [
          { text: '취소', style: 'cancel' },
          { text: '계속', onPress: () => doSave(true, nextAction) },
        ],
      );
      return;
    }

    doSave(false, nextAction);
  };

  const handleSave = () => trySave('back');

  // 학교/전공 입력 중 바로 서류 인증으로 넘어갈 때도 입력한 학력을 먼저 저장해 educationId를 확보한다.
  const handleUploadPress = () => trySave('cert');

  const doSave = async (resetVerification: boolean, nextAction: 'back' | 'cert') => {
    setLoading(true);
    try {
      const educationId = await submitEducation(0, {
        schoolName: schoolName.trim(),
        status: educationStatus,
        majorType: subMajor ? 'DOUBLE' : 'SINGLE',
        major: major || '',
        subMajor: subMajor || null,
      });
      updateEducationLocal({
        educationId,
        schoolName: schoolName.trim(),
        status: educationStatus,
        major: major || '',
        subMajor: subMajor || null,
        verified: resetVerification ? false : profile?.education?.verified ?? false,
        verificationStatus: resetVerification ? 'NONE' : verificationStatus,
      });
      if (nextAction === 'cert') {
        router.push('/(tabs)/profile/education-cert');
      } else {
        router.back();
      }
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubmission = () => {
    const educationId = profile?.education?.educationId;
    if (!educationId) return;
    Alert.alert('제출 취소', '제출한 서류를 취소할까요?', [
      { text: '아니오', style: 'cancel' },
      {
        text: '취소하기',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelEducationCert(educationId);
            updateEducationLocal({
              educationId,
              schoolName,
              status: educationStatus,
              major: major || '',
              subMajor: subMajor || null,
              verified: false,
              verificationStatus: 'NONE',
            });
          } catch {
            Alert.alert('오류', '취소에 실패했어요. 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="학력 정보" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── 타이틀 섹션 ── */}
        <View style={styles.titleSection}>
          <Text style={styles.sectionTitle}>학력을 입력해 주세요</Text>
          <Text style={styles.sectionDesc}>
            기본 정보 다음으로 학력 및 전공을 알려주세요
          </Text>
        </View>

        {/* ── 학교 검색 ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            학교 <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.searchBox,
              schoolName ? styles.searchBoxFilled : undefined,
            ]}
            onPress={() => setShowSchoolSearch(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.searchBoxText,
                !schoolName && styles.placeholder,
              ]}
            >
              {schoolName || '학교 이름을 검색하세요'}
            </Text>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* ── 재학 상태 ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>재학 상태</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.statusTab,
                  educationStatus === opt.key && styles.statusTabActive,
                ]}
                onPress={() => setEducationStatus(opt.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    educationStatus === opt.key && styles.statusTabTextActive,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 학과 정보 ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>주전공 (선택)</Text>
          <View style={styles.searchBoxRow}>
            <TouchableOpacity
              style={[
                styles.searchBox,
                styles.searchBoxFlex,
                major ? styles.searchBoxSelected : undefined,
              ]}
              onPress={() => setShowMajorSearch(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.searchBoxText, !major && styles.placeholder]}>
                {major || '학과 이름을 검색하세요'}
              </Text>
              {!major && <Text style={styles.searchIcon}>🔍</Text>}
            </TouchableOpacity>
            {major ? (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setMajor('')}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {subMajor !== null ? (
            <View style={styles.subMajorSection}>
              <Text style={styles.subMajorLabel}>복수전공 (선택)</Text>
              <View style={styles.subMajorRow}>
                <TouchableOpacity
                  style={[styles.searchBox, styles.searchBoxSelected, styles.searchBoxFlex]}
                  onPress={() => setShowSubMajorSearch(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.searchBoxText}>{subMajor}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setSubMajor(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowSubMajorSearch(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.addSubMajorText}>+ 복수전공 추가</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 학교 인증 섹션 ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabelBold}>학교 인증</Text>

          {/* 프로모 배너 */}
          <View style={styles.promoBanner}>
            <Text style={styles.promoBannerTitle}>
              학교를 인증하고 뱃지를 받아보세요 🏫
            </Text>
            <Text style={styles.promoBannerDesc}>
              인증하면 프로필에 뱃지가 표시되고 매칭 시 신뢰도가 올라가요
            </Text>
          </View>

          {/* 서류 업로드 */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadSectionTitle}>학생증 · 재학증명서 인증</Text>
            <Text style={styles.uploadSectionDesc}>
              서류 이미지를 업로드하면 운영팀이 검토해요 (1~2일)
            </Text>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handleUploadPress}
              activeOpacity={0.7}
            >
              <Text style={styles.uploadBtnText}>📎 파일 업로드</Text>
            </TouchableOpacity>
          </View>

          {/* 상태별 인증 카드 — 인증된 학교명은 폼에서 편집 중인 schoolName이 아니라
              서버에 저장된 profile.education.schoolName을 그대로 보여줘야 한다.
              안 그러면 학교를 바꾸자마자(저장 전에도) 아직 인증받지 않은 새 학교가
              "인증 완료"로 표시된다. */}
          <CertStatusCard
            verificationStatus={verificationStatus}
            verificationFileName={profile?.education?.verificationFileName}
            verificationRejectReason={
              profile?.education?.verificationRejectReason
            }
            schoolName={profile?.education?.schoolName ?? schoolName}
            verificationSubmittedAt={
              profile?.education?.verificationSubmittedAt
            }
            onCancelSubmission={handleCancelSubmission}
          />
        </View>
      </ScrollView>

      {/* ── 확인 버튼: 인증 상태와 무관하게 학교/학과 정보 저장 ── */}
      {/* 서류 제출은 위쪽 "파일 업로드" 버튼으로 별도 진입 (학력 수정과 인증 제출은 별개의 동작) */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>
            {loading ? '저장 중...' : '확인'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 학교 검색 BottomSheet ── */}
      <SearchBottomSheet
        visible={showSchoolSearch}
        title="학교 검색"
        placeholder="학교 이름을 검색하세요"
        items={SCHOOL_LIST}
        onSelect={(s) => {
          setSchoolName(s);
          setShowSchoolSearch(false);
        }}
        onClose={() => setShowSchoolSearch(false)}
        allowCustomInput
        customInputLabel="직접 입력하기"
        customInputPlaceholder="학교명을 입력하세요"
        customInputDesc="목록에 없는 학교명을 직접 입력하세요"
      />

      {/* ── 주전공 검색 BottomSheet ── */}
      <SearchBottomSheet
        visible={showMajorSearch}
        title="학과 검색"
        placeholder="학과 이름을 검색하세요"
        items={MAJOR_LIST}
        onSelect={(s) => {
          setMajor(s);
          setShowMajorSearch(false);
        }}
        onClose={() => setShowMajorSearch(false)}
        allowCustomInput
        customInputLabel="직접 입력하기"
        customInputPlaceholder="학과명을 입력하세요"
        customInputDesc="목록에 없는 학과명을 직접 입력하세요"
      />

      {/* ── 복수전공 검색 BottomSheet ── */}
      <SearchBottomSheet
        visible={showSubMajorSearch}
        title="복수전공 검색"
        placeholder="학과 이름을 검색하세요"
        items={MAJOR_LIST}
        onSelect={(s) => {
          setSubMajor(s);
          setShowSubMajorSearch(false);
        }}
        onClose={() => setShowSubMajorSearch(false)}
        allowCustomInput
        customInputLabel="직접 입력하기"
        customInputPlaceholder="학과명을 입력하세요"
        customInputDesc="목록에 없는 학과명을 직접 입력하세요"
      />
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

  // ── 타이틀 섹션 ──
  titleSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 18,
  },

  // ── 카드 ──
  card: {
    backgroundColor: Colors.white,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardLabel: {
    fontSize: 13,
    color: Colors.gray,
    fontWeight: '500',
    marginBottom: 10,
  },
  cardLabelBold: {
    fontSize: 13,
    color: Colors.gray,
    fontWeight: '700',
    marginBottom: 10,
  },
  required: {
    color: Colors.primary,
  },

  // ── 검색 박스 ──
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  searchBoxFilled: {
    borderColor: Colors.primary,
  },
  searchBoxSelected: {
    borderColor: Colors.lightGray,
    backgroundColor: Colors.pageBg,
  },
  searchBoxText: {
    fontSize: 15,
    color: Colors.dark,
    flex: 1,
  },
  placeholder: {
    color: Colors.grayMedium,
  },
  searchIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  searchBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchBoxFlex: {
    flex: 1,
    marginBottom: 0,
  },

  // ── 재학 상태 탭 ──
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 20,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTabActive: {
    backgroundColor: Colors.primary,
  },
  statusTabText: {
    fontSize: 13,
    color: Colors.gray,
    fontWeight: '500',
  },
  statusTabTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },

  // ── 복수전공 ──
  subMajorSection: {
    marginTop: 12,
  },
  subMajorLabel: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 8,
  },
  subMajorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 11,
    color: Colors.gray,
    fontWeight: '600',
  },
  addSubMajorText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    paddingVertical: 8,
  },

  // ── 프로모 배너 ──
  promoBanner: {
    backgroundColor: Colors.ogTint,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  promoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  promoBannerDesc: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 17,
  },

  // ── 학생증·재학증명서 인증 (파일 업로드) ──
  uploadSection: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  uploadSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  uploadSectionDesc: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 17,
    marginBottom: 10,
  },
  uploadBtn: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnText: {
    fontSize: 13,
    color: Colors.gray,
    fontWeight: '600',
  },

  // ── 상태 카드 공통 ──
  certStatusCard: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.white,
  },

  // NONE
  statusChipRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusChipGray: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.pageBg,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  statusChipGrayText: {
    fontSize: 12,
    color: Colors.gray,
  },
  warningBox: {
    backgroundColor: Colors.pageBg,
    borderRadius: 8,
    padding: 12,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 17,
  },

  // PENDING
  statusCardGreen: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  statusCardGreenText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 6,
  },
  statusCardDesc: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 18,
  },
  statusCardDescBold: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  submittedFileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.pageBg,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  submittedFileIcon: {
    fontSize: 22,
  },
  submittedFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  submittedFileDate: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginBottom: 8,
  },
  cancelSubmitBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  cancelSubmitBtnText: {
    fontSize: 12,
    color: Colors.error,
  },

  // APPROVED
  // (uses statusCardGreen styles above)

  // REJECTED
  statusCardRed: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  statusCardRedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C62828',
    marginBottom: 6,
  },
  rejectReasonBox: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  rejectReasonTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  rejectReason: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 17,
    marginTop: 4,
  },

  // ── 푸터 ──
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  confirmBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
