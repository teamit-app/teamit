import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { Alert } from '../../src/utils/alert';
import {
  getPendingEducations,
  reviewEducation,
  getEducationFileUrl,
  PendingEducation,
} from '../../src/services/adminService';

const DOC_TYPE_LABEL: Record<string, string> = {
  STUDENT_ID: '학생증',
  ENROLLMENT_CERT: '재학증명서',
};

// 내부 관리용 화면 — 별도 메뉴 진입점 없이 직접 이 경로로 접속해서 사용한다.
// (베타테스트 단계: 관리자 role 체계 없이 백엔드에서 admin.user-id 하나만 허용)
export default function AdminEducationVerificationsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<PendingEducation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selected, setSelected] = useState<PendingEducation | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setIsLoading(true);
    getPendingEducations()
      .then(setItems)
      .catch((e: unknown) => console.error('[Admin] 목록 로드 실패:', e))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (item: PendingEducation) => {
    setSelected(item);
    setShowRejectInput(false);
    setRejectReason('');
    setFileUrl(null);
    setFileLoading(true);
    try {
      const url = await getEducationFileUrl(item.educationId);
      setFileUrl(url);
    } catch (e) {
      console.error('[Admin] 파일 로드 실패:', e);
    } finally {
      setFileLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setFileUrl(null);
  };

  const handleApprove = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await reviewEducation(selected.educationId, { status: 'APPROVED' });
      closeDetail();
      load();
    } catch (e) {
      console.error('[Admin] 승인 실패:', e);
      Alert.alert('오류', '승인 처리에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selected || submitting) return;
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    setSubmitting(true);
    try {
      await reviewEducation(selected.educationId, {
        status: 'REJECTED',
        rejectReason: rejectReason || undefined,
      });
      closeDetail();
      load();
    } catch (e) {
      console.error('[Admin] 거절 실패:', e);
      Alert.alert('오류', '거절 처리에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="학력 인증 심사" onBack={() => router.back()} />

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyText}>심사 대기 중인 인증이 없어요</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.educationId}
              style={s.card}
              onPress={() => openDetail(item)}
              activeOpacity={0.8}
            >
              <Text style={s.name}>{item.nickname}</Text>
              <Text style={s.meta}>{item.schoolName} · {item.major}</Text>
              <Text style={s.meta}>
                {DOC_TYPE_LABEL[item.docType] ?? item.docType} · 제출일 {item.submittedAt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal visible={!!selected} animationType="slide" onRequestClose={closeDetail}>
        <View style={[s.container, { paddingTop: insets.top }]}>
          <ScreenHeader title={selected?.nickname ?? ''} onBack={closeDetail} />
          <ScrollView contentContainerStyle={s.detailScroll}>
            {selected && (
              <>
                <Text style={s.meta}>{selected.schoolName} · {selected.major}</Text>
                <Text style={s.meta}>{DOC_TYPE_LABEL[selected.docType] ?? selected.docType}</Text>

                <View style={s.imageBox}>
                  {fileLoading ? (
                    <ActivityIndicator size="large" color={Colors.primary} />
                  ) : fileUrl ? (
                    <Image source={{ uri: fileUrl }} style={s.image} resizeMode="contain" />
                  ) : (
                    <Text style={s.emptyText}>파일을 불러올 수 없어요</Text>
                  )}
                </View>

                {showRejectInput && (
                  <TextInput
                    style={s.rejectInput}
                    placeholder="거절 사유 (선택)"
                    placeholderTextColor={Colors.grayMedium}
                    value={rejectReason}
                    onChangeText={setRejectReason}
                  />
                )}

                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={[s.actionBtn, s.rejectBtn]}
                    onPress={handleReject}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    <Text style={s.rejectBtnText}>{showRejectInput ? '거절 확정' : '거절'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtn, s.approveBtn]}
                    onPress={handleApprove}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    <Text style={s.approveBtnText}>승인</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: Colors.grayMedium },

  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 3,
  },
  name: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  meta: { fontSize: 13, color: Colors.grayMedium },

  detailScroll: { padding: 16, gap: 12 },
  imageBox: {
    marginTop: 12,
    minHeight: 320,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: 400 },

  rejectInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.white,
  },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: { borderWidth: 1.5, borderColor: Colors.error },
  rejectBtnText: { fontSize: 15, fontWeight: '700', color: Colors.error },
  approveBtn: { backgroundColor: Colors.primary },
  approveBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
