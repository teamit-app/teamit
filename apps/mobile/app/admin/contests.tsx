import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/constants/colors';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { Alert } from '../../src/utils/alert';
import {
  getAdminContests,
  createContest,
  updateContest,
  deleteContest,
  uploadContestPosterImage,
  AdminContest,
  ContestFormData,
} from '../../src/services/adminService';
import { ContestCategory } from '../../src/types/contest';
import { resolveImageUrl } from '../../src/utils/imageUrl';

const CATEGORIES: ContestCategory[] = ['IT', 'STARTUP', 'DESIGN', 'SOCIAL', 'ENGINEERING', 'ARTS', 'MARKETING', 'ETC'];
const CATEGORY_LABEL: Record<ContestCategory, string> = {
  IT: 'IT·개발',
  STARTUP: '창업·아이디어',
  DESIGN: '디자인',
  SOCIAL: '사회혁신',
  ENGINEERING: '공학',
  ARTS: '예술',
  MARKETING: '마케팅',
  ETC: '기타',
};

const EMPTY_FORM: ContestFormData = {
  title: '',
  organizer: '',
  category: 'IT',
  target: '',
  recruitField: '',
  prize: '',
  startDate: '',
  endDate: '',
  linkUrl: '',
  content: '',
  imageUrl: '',
};

// 내부 관리용 화면 — 별도 메뉴 진입점 없이 직접 이 경로로 접속해서 사용한다.
// (관리자 권한은 백엔드에서 users.role = ADMIN 여부로 체크한다)
export default function AdminContestsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AdminContest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContestFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const load = () => {
    setIsLoading(true);
    getAdminContests()
      .then(setItems)
      .catch((e: unknown) => console.error('[Admin] 공모전 목록 로드 실패:', e))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormVisible(true);
  };

  const openEdit = (item: AdminContest) => {
    setEditingId(item.contestId);
    setForm({
      title: item.title,
      organizer: item.organizer,
      category: item.category,
      target: item.target ?? '',
      recruitField: item.recruitField ?? '',
      prize: item.prize ?? '',
      startDate: item.startDate ?? '',
      endDate: item.endDate ?? '',
      linkUrl: item.linkUrl ?? '',
      content: item.content ?? '',
      imageUrl: item.imageUrl ?? '',
    });
    setFormVisible(true);
  };

  const closeForm = () => setFormVisible(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요해요');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const fileName = asset.fileName ?? `poster.${asset.mimeType?.split('/')[1] ?? 'jpg'}`;
    setUploadingImage(true);
    try {
      const imageUrl = await uploadContestPosterImage(asset.uri, fileName);
      setForm((f) => ({ ...f, imageUrl }));
    } catch (e) {
      Alert.alert('오류', e instanceof Error ? e.message : '이미지 업로드에 실패했어요.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.organizer.trim() || !form.endDate.trim()) {
      Alert.alert('입력 확인', '공모전명, 주최기관, 모집마감일은 필수예요.');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editingId != null) {
        await updateContest(editingId, form);
      } else {
        await createContest(form);
      }
      setFormVisible(false);
      load();
    } catch (e) {
      console.error('[Admin] 공모전 저장 실패:', e);
      Alert.alert('오류', '저장에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (editingId == null) return;
    Alert.alert(
      '공모전 삭제',
      '이 공모전을 삭제할까요? 이 작업은 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContest(editingId);
              setFormVisible(false);
              load();
            } catch (e) {
              console.error('[Admin] 공모전 삭제 실패:', e);
              Alert.alert('오류', '삭제에 실패했어요.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="공모전 관리" onBack={() => router.back()} />

      <TouchableOpacity style={s.createBtn} onPress={openCreate} activeOpacity={0.85}>
        <Text style={s.createBtnText}>+ 새 공모전 등록</Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyText}>등록된 공모전이 없어요</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.contestId}
              style={s.card}
              onPress={() => openEdit(item)}
              activeOpacity={0.8}
            >
              <Text style={s.cardCategory}>{CATEGORY_LABEL[item.category]}</Text>
              <Text style={s.cardTitle}>{item.title}</Text>
              <Text style={s.meta}>{item.organizer} · 마감 {item.endDate} (D{item.dDay >= 0 ? `-${item.dDay}` : `+${-item.dDay}`})</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal visible={formVisible} animationType="slide" onRequestClose={closeForm}>
        <View style={[s.container, { paddingTop: insets.top }]}>
          <ScreenHeader title={editingId != null ? '공모전 수정' : '공모전 등록'} onBack={closeForm} />
          <ScrollView contentContainerStyle={s.formScroll}>
            <FormField label="공모전명 *" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
            <FormField label="주최기관 *" value={form.organizer} onChangeText={(v) => setForm((f) => ({ ...f, organizer: v }))} />

            <Text style={s.label}>카테고리 *</Text>
            <View style={s.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catChip, form.category === cat && s.catChipActive]}
                  onPress={() => setForm((f) => ({ ...f, category: cat }))}
                >
                  <Text style={[s.catChipText, form.category === cat && s.catChipTextActive]}>
                    {CATEGORY_LABEL[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FormField label="모집 대상" value={form.target ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, target: v }))} />
            <FormField label="모집 분야" value={form.recruitField ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, recruitField: v }))} />
            <FormField label="시상 규모" value={form.prize ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, prize: v }))} />
            <FormField
              label="접수 시작일 (YYYY-MM-DD)"
              value={form.startDate ?? ''}
              onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
              placeholder="2026-01-01"
            />
            <FormField
              label="모집 마감일 * (YYYY-MM-DD)"
              value={form.endDate}
              onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))}
              placeholder="2026-02-28"
            />
            <FormField label="접수 URL" value={form.linkUrl ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, linkUrl: v }))} />

            <Text style={s.label}>포스터 이미지</Text>
            {form.imageUrl ? (
              <Image
                source={{ uri: resolveImageUrl(form.imageUrl) ?? undefined }}
                style={s.posterPreview}
                resizeMode="contain"
              />
            ) : null}
            <TouchableOpacity
              style={s.pickImageBtn}
              onPress={handlePickImage}
              disabled={uploadingImage}
              activeOpacity={0.85}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={s.pickImageBtnText}>갤러리에서 선택</Text>
              )}
            </TouchableOpacity>
            <FormField label="포스터 이미지 URL (직접 입력도 가능)" value={form.imageUrl ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, imageUrl: v }))} />

            <Text style={s.label}>상세내용</Text>
            <TextInput
              style={s.contentInput}
              value={form.content ?? ''}
              onChangeText={(v) => setForm((f) => ({ ...f, content: v }))}
              multiline
              textAlignVertical="top"
              placeholder="모집 공고 본문을 자유롭게 입력하세요"
              placeholderTextColor={Colors.grayMedium}
            />

            <View style={s.actionRow}>
              {editingId != null && (
                <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={handleDelete} activeOpacity={0.85}>
                  <Text style={s.deleteBtnText}>삭제</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.actionBtn, s.saveBtn]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={s.saveBtnText}>{submitting ? '저장 중...' : '저장'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.grayMedium}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: Colors.grayMedium },

  createBtn: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

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
  cardCategory: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  meta: { fontSize: 13, color: Colors.grayMedium },

  formScroll: { padding: 16, gap: 4, paddingBottom: 40 },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.dark, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.white,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  catChip: {
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.ogTint },
  catChipText: { fontSize: 13, color: Colors.grayMedium },
  catChipTextActive: { color: Colors.primary, fontWeight: '700' },

  posterPreview: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: Colors.lightGray,
  },
  pickImageBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pickImageBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  contentInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.white,
    minHeight: 160,
    marginBottom: 14,
  },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: { borderWidth: 1.5, borderColor: Colors.error },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: Colors.error },
  saveBtn: { backgroundColor: Colors.primary },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
