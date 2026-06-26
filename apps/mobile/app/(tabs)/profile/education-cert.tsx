import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { useMypageStore } from '../../../src/store/useMypageStore';
import { submitEducationCert } from '../../../src/services/mypageService';

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────
type DocType = 'STUDENT_ID' | 'ENROLLMENT_CERT';
type Step = 1 | 2 | 3;

// ──────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────
const DOC_OPTIONS: { key: DocType; icon: string; title: string; desc: string }[] = [
  {
    key: 'STUDENT_ID',
    icon: '🪪',
    title: '학생증',
    desc: '실물 또는 모바일 학생증 사진',
  },
  {
    key: 'ENROLLMENT_CERT',
    icon: '📑',
    title: '재학증명서',
    desc: '학교 포털에서 발급 가능해요',
  },
];

const CHECKLIST_ITEMS = [
  '이름이 선명하게 보여요',
  '학교명과 학과가 확인돼요',
  '발급일이 3개월 이내예요',
];

// ──────────────────────────────────────────────────
// ProgressDots
// ──────────────────────────────────────────────────
function ProgressDots({ step }: { step: Step }) {
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel}>{step}단계 / 3단계</Text>
      <View style={styles.progressDots}>
        {([1, 2, 3] as Step[]).map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s <= step ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────────
export default function EducationCertScreen() {
  const insets = useSafeAreaInsets();
  const { profile, reloadProfile } = useMypageStore();

  const [step, setStep] = useState<Step>(1);
  const [docType, setDocType] = useState<DocType>('ENROLLMENT_CERT');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step 2 체크리스트 상태
  const [checklist, setChecklist] = useState([false, false, false]);

  const educationId = profile?.education?.educationId ?? 1;

  const toggleCheck = (idx: number) => {
    setChecklist((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const pickFromAlbum = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요해요');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setFileName(uri.split('/').pop() ?? '선택된_이미지.jpg');
    }
  };

  const pickFromFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setFileName(result.assets[0].name);
    }
  };

  const handleFileSelect = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '앨범에서 선택', '파일에서 선택'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickFromAlbum();
          if (buttonIndex === 2) pickFromFiles();
        }
      );
    } else {
      Alert.alert('파일 첨부', '첨부 방법을 선택해주세요', [
        { text: '취소', style: 'cancel' },
        { text: '앨범에서 선택', onPress: pickFromAlbum },
        { text: '파일에서 선택', onPress: pickFromFiles },
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!fileName) {
      Alert.alert('알림', '파일을 선택해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await submitEducationCert(educationId, { docType, fileName });
      await reloadProfile();
      setStep(3);
    } catch {
      Alert.alert('오류', '제출에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 1: 서류 선택 ──────────────────────────
  if (step === 1) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="서류 인증" onBack={() => router.back()} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ProgressDots step={1} />

          {/* 타이틀 */}
          <View style={styles.stepTitleSection}>
            <Text style={styles.stepTitle}>제출할 서류를 선택해 주세요</Text>
            <Text style={styles.stepDesc}>
              학교 재학·졸업 여부를 확인할 수 있는 서류예요
            </Text>
          </View>

          {/* 서류 유형 선택 카드 */}
          {DOC_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.docOption,
                docType === opt.key && styles.docOptionActive,
              ]}
              onPress={() => setDocType(opt.key)}
              activeOpacity={0.7}
            >
              <View style={styles.docOptionLeft}>
                <Text style={styles.docOptionIcon}>{opt.icon}</Text>
                <View style={styles.docOptionText}>
                  <Text style={styles.docOptionTitle}>{opt.title}</Text>
                  <Text style={styles.docOptionDesc}>{opt.desc}</Text>
                </View>
              </View>
              {/* 라디오 버튼 */}
              <View
                style={[
                  styles.radioCircle,
                  docType === opt.key && styles.radioCircleActive,
                ]}
              >
                {docType === opt.key && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {/* 파일 업로드 영역 */}
          {!fileName ? (
            <View style={styles.uploadArea}>
              <View style={styles.uploadEmptyBox}>
                <Text style={styles.uploadBoxIcon}>📁</Text>
                <Text style={styles.uploadBoxText}>파일을 업로드해 주세요</Text>
                <Text style={styles.uploadHint}>JPG, PNG, PDF · 최대 10MB</Text>
              </View>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handleFileSelect}
                activeOpacity={0.7}
              >
                <Text style={styles.attachBtnText}>첨부하기</Text>
              </TouchableOpacity>
              <View style={styles.cautionBanner}>
                <Text style={styles.cautionTitle}>⚠️ 제출 전 확인해 주세요</Text>
                <Text style={styles.cautionItem}>· 이름, 학교명, 학과가 선명하게 보여야 해요</Text>
                <Text style={styles.cautionItem}>· 발급일로부터 3개월 이내 서류만 인정돼요</Text>
              </View>
            </View>
          ) : (
            <View style={styles.fileSelectedArea}>
              {/* 점선 박스 — 파일 카드 + 변경 버튼 */}
              <View style={styles.uploadArea}>
                <View style={styles.fileSelectedCard}>
                  <Text style={styles.fileSelectedIcon}>📄</Text>
                  <View style={styles.fileSelectedInfo}>
                    <Text style={styles.fileSelectedName} numberOfLines={2}>{fileName}</Text>
                    <Text style={styles.fileSelectedType}>{docType === 'STUDENT_ID' ? '학생증' : '재학증명서'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setFileName('')}
                    style={styles.fileRemoveBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.fileRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.changeFileBtn}
                  onPress={handleFileSelect}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeFileBtnText}>파일 변경하기</Text>
                </TouchableOpacity>
                <View style={styles.cautionBanner}>
                  <Text style={styles.cautionTitle}>⚠️ 제출 전 확인해 주세요</Text>
                  <Text style={styles.cautionItem}>· 이름, 학교명, 학과가 선명하게 보여야 해요</Text>
                  <Text style={styles.cautionItem}>· 발급일로부터 3개월 이내 서류만 인정돼요</Text>
                </View>
              </View>
              {/* 다음 버튼 */}
              <TouchableOpacity
                style={styles.nextBtnInline}
                onPress={() => setStep(2)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>다음</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Step 2: 파일 확인 ──────────────────────────
  if (step === 2) {
    const allChecked = checklist.every(Boolean);

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="서류 인증"
          onBack={() => setStep(1)}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ProgressDots step={2} />

          {/* 타이틀 */}
          <View style={styles.stepTitleSection}>
            <Text style={styles.stepTitle}>업로드할 파일을 확인해 주세요</Text>
            <Text style={styles.stepDesc}>
              제출 전 내용이 선명하게 보이는지 확인해요
            </Text>
          </View>

          {/* 파일 카드 */}
          <View style={styles.fileCard}>
            <Text style={styles.fileCardIcon}>📄</Text>
            <View style={styles.fileCardInfo}>
              <Text style={styles.fileCardName}>{fileName}</Text>
              <Text style={styles.fileCardSize}>2.3MB · JPG</Text>
            </View>
          </View>

          {/* 체크리스트 */}
          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>제출 전 체크리스트</Text>
            {CHECKLIST_ITEMS.map((label, idx) => {
              const checked = checklist[idx] ?? false;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.checkItem}
                  onPress={() => toggleCheck(idx)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkBox,
                      checked && styles.checkBoxChecked,
                    ]}
                  >
                    {checked && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.checkText,
                      checked && styles.checkTextChecked,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {!allChecked && (
              <Text style={styles.checkHint}>
                ☝️ 위 항목을 모두 체크해야 제출할 수 있어요
              </Text>
            )}
          </View>
        </ScrollView>

        {/* 다시 선택 / 제출하기 버튼 */}
        <View
          style={[styles.footer, styles.footerRow, { paddingBottom: insets.bottom + 16 }]}
        >
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => setStep(1)}
            activeOpacity={0.7}
          >
            <Text style={styles.outlineBtnText}>다시 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { flex: 1 },
              (!allChecked || submitting) && styles.primaryBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!allChecked || submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? '제출 중...' : '제출하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Step 3: 제출 완료 ──────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="서류 인증" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        <ProgressDots step={3} />

        {/* 완료 아이콘 + 텍스트 */}
        <View style={styles.completeCenter}>
          <Text style={styles.completeIcon}>📤</Text>
          <Text style={styles.completeTitle}>제출이 완료됐어요!</Text>
          <Text style={styles.completeDesc}>
            {'운영팀이 서류를 검토한 후\n1~2일 내로 결과를 알려드려요'}
          </Text>
        </View>

        {/* 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>서류 종류</Text>
            <Text style={styles.summaryValue}>
              {docType === 'STUDENT_ID' ? '학생증' : '재학증명서'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>파일명</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {fileName}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>제출 일시</Text>
            <Text style={styles.summaryValue}>
              {new Date().toLocaleDateString('ko-KR')}
            </Text>
          </View>
        </View>

        {/* 확인 버튼 */}
        <TouchableOpacity
          style={[styles.primaryBtn, { marginHorizontal: 16, marginTop: 24 }]}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>확인</Text>
        </TouchableOpacity>
      </ScrollView>
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

  // ── 진행 표시 ──
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.grayMedium,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  progressDotInactive: {
    backgroundColor: Colors.lightGray,
  },

  // ── 스텝 타이틀 ──
  stepTitleSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 18,
  },

  // ── 서류 선택 카드 ──
  docOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  docOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.ogTint,
  },
  docOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  docOptionIcon: {
    fontSize: 24,
  },
  docOptionText: {
    flex: 1,
  },
  docOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 2,
  },
  docOptionDesc: {
    fontSize: 13,
    color: Colors.gray,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  // ── 파일 업로드 영역 (미선택) ──
  uploadArea: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    alignItems: 'stretch',
  },
  uploadEmptyBox: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 16,
  },
  uploadBoxIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  uploadBoxText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginTop: 4,
    marginBottom: 16,
  },
  attachBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    marginBottom: 16,
    alignSelf: 'center',
  },
  attachBtnText: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  // ── 파일 선택 후 영역 ──
  fileSelectedArea: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  fileSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 14,
    gap: 12,
  },
  fileSelectedIcon: {
    fontSize: 32,
  },
  fileSelectedInfo: {
    flex: 1,
  },
  fileSelectedName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 3,
  },
  fileSelectedType: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
  fileRemoveBtn: {
    padding: 4,
  },
  fileRemoveText: {
    fontSize: 16,
    color: Colors.grayMedium,
  },
  changeFileBtn: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  changeFileBtnText: {
    fontSize: 13,
    color: Colors.gray,
  },
  nextBtnInline: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 8,
  },

  cautionBanner: {
    width: '100%',
    backgroundColor: Colors.ogTint,
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  cautionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  cautionItem: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 18,
  },

  // ── 파일 카드 (Step 2) ──
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    gap: 12,
  },
  fileCardIcon: {
    fontSize: 32,
  },
  fileCardInfo: {
    flex: 1,
  },
  fileCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  fileCardSize: {
    fontSize: 13,
    color: Colors.grayMedium,
  },

  // ── 체크리스트 (Step 2) ──
  checklistCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 14,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkBoxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkMark: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '700',
  },
  checkText: {
    fontSize: 14,
    color: Colors.gray,
    flex: 1,
  },
  checkTextChecked: {
    color: Colors.dark,
    fontWeight: '500',
  },
  checkHint: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginTop: 10,
    textAlign: 'center',
  },

  // ── Step 3 완료 ──
  completeContainer: {
    flex: 1,
  },
  completeCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  completeIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  completeDesc: {
    fontSize: 15,
    color: Colors.gray,
    lineHeight: 24,
    textAlign: 'center',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.gray,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },

  // ── 푸터 ──
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  outlineBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 15,
    color: Colors.gray,
    fontWeight: '500',
  },
});
