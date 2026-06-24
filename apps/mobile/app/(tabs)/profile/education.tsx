import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { SearchBottomSheet } from '../../../src/components/common/SearchBottomSheet';
import { useMypageStore } from '../../../src/store/useMypageStore';
import { SCHOOL_LIST, MAJOR_LIST } from '../../../src/data/schools';
import { EducationStatus, VerificationStatus } from '../../../src/types/mypage';

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
}: {
  verificationStatus: VerificationStatus;
  verificationFileName?: string;
  verificationRejectReason?: string | null;
  schoolName: string;
  verificationSubmittedAt?: string;
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
            인증하면 프로필에 뱃지가 표시되고 매칭 신뢰도가 높아져요
          </Text>
          <View style={styles.warningBtnRow}>
            <TouchableOpacity style={styles.warningOutlineBtn} activeOpacity={0.7}>
              <Text style={styles.warningOutlineBtnText}>확인</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.warningFillBtn}
              onPress={() => router.push('/(tabs)/profile/education-cert')}
              activeOpacity={0.7}
            >
              <Text style={styles.warningFillBtnText}>서류 제출하기</Text>
            </TouchableOpacity>
          </View>
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
              <View style={styles.submittedFileBtnRow}>
                <TouchableOpacity style={styles.submittedFileBtn} activeOpacity={0.7}>
                  <Text style={styles.submittedFileBtnText}>제출 확인</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submittedFileBtn} activeOpacity={0.7}>
                  <Text style={[styles.submittedFileBtnText, { color: Colors.error }]}>취소하기</Text>
                </TouchableOpacity>
              </View>
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
        {verificationRejectReason ? (
          <Text style={styles.rejectReason}>
            · {verificationRejectReason}
          </Text>
        ) : (
          <Text style={styles.rejectReason}>
            · 제출하신 이미지의 해상도가 낮아 정보 확인이 어려워요
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.resubmitBtn}
        onPress={() => router.push('/(tabs)/profile/education-cert')}
        activeOpacity={0.7}
      >
        <Text style={styles.resubmitBtnText}>다시 제출하기</Text>
      </TouchableOpacity>
    </View>
  );
}

// ──────────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────────
export default function EducationScreen() {
  const insets = useSafeAreaInsets();
  const { profile, reloadProfile } = useMypageStore();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';

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

  useEffect(() => {
    if (profile?.education) {
      setSchoolName(profile.education.schoolName);
      setEducationStatus(profile.education.status);
      setMajor(profile.education.major);
      setSubMajor(profile.education.subMajor ?? null);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!schoolName.trim()) {
      Alert.alert('알림', '학교명을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await reloadProfile();
      router.back();
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
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
          <TouchableOpacity
            style={[styles.searchBox, major ? styles.searchBoxSelected : undefined]}
            onPress={() => setShowMajorSearch(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.searchBoxText, !major && styles.placeholder]}>
              {major || '학과 이름을 검색하세요'}
            </Text>
            {!major && <Text style={styles.searchIcon}>🔍</Text>}
          </TouchableOpacity>

          {subMajor !== null ? (
            <View style={styles.subMajorSection}>
              <Text style={styles.subMajorLabel}>복수전공 (선택)</Text>
              <TouchableOpacity
                style={[styles.searchBox, styles.searchBoxSelected]}
                onPress={() => setShowSubMajorSearch(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.searchBoxText}>{subMajor}</Text>
              </TouchableOpacity>
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
        {isEditMode && verificationStatus === 'APPROVED' ? (
          /* 수정 모드 + 인증 완료: 컴팩트 배너 */
          <View style={styles.approvedBanner}>
            <Text style={styles.approvedBannerIcon}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.approvedBannerTitle}>
                인증 완료된 학교입니다
              </Text>
              <Text style={styles.approvedBannerDesc}>
                학교를 변경하면 재인증이 필요할 수 있어요
              </Text>
            </View>
          </View>
        ) : (
          /* 일반 모드 또는 미인증 */
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

            {/* 상태별 인증 카드 */}
            <CertStatusCard
              verificationStatus={verificationStatus}
              verificationFileName={profile?.education?.verificationFileName}
              verificationRejectReason={
                profile?.education?.verificationRejectReason
              }
              schoolName={schoolName}
              verificationSubmittedAt={
                profile?.education?.verificationSubmittedAt
              }
            />
          </View>
        )}
      </ScrollView>

      {/* ── 확인 버튼 ── */}
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
  removeSubMajorBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSubMajorText: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '600',
  },
  addSubMajorText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    paddingVertical: 8,
  },

  // ── 수정 모드 인증 완료 배너 ──
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    backgroundColor: Colors.ogTint,
    borderRadius: 12,
    padding: 16,
  },
  approvedBannerIcon: {
    fontSize: 22,
  },
  approvedBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  approvedBannerDesc: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 18,
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

  // ── 상태 카드 공통 ──
  certStatusCard: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.white,
  },

  // NONE
  uploadOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 12,
  },
  uploadOutlineBtnText: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
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
    backgroundColor: Colors.ogTint,
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
    marginBottom: 12,
  },
  warningBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  warningOutlineBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningOutlineBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  warningFillBtn: {
    flex: 2,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningFillBtnText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '700',
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
    marginBottom: 8,
  },
  submittedFileBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  submittedFileBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  submittedFileBtnText: {
    fontSize: 12,
    color: Colors.gray,
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
  rejectReason: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 17,
    marginTop: 4,
  },
  resubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
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
