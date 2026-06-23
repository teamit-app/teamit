import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { useBuildTeamStore } from '../../../../src/store/useBuildTeamStore';

const TOTAL_STEPS = 5;
const CURRENT_STEP = 4;

const GUIDE_ITEMS = [
  {
    icon: '✅',
    title: '팀 소개',
    desc: '나는 어떤 사람인지, 어떤 팀을 원하는지 자유롭게 적어보세요.',
  },
  {
    icon: '💪',
    title: '관심 분야',
    desc: '어떤 분야에 관심이 있는 팀원이 있으면 좋겠나요?',
  },
  {
    icon: '🔥',
    title: '소프트 스킬',
    desc: '발표 역량, 일정 관리 능력 등, 어떤 업무 수행 능력을 가진 팀원을 찾고 계신가요?',
  },
];

export default function RecruitPostScreen() {
  const insets = useSafeAreaInsets();
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const postTitle = useBuildTeamStore((s) => s.postTitle);
  const postContent = useBuildTeamStore((s) => s.postContent);
  const setPostTitle = useBuildTeamStore((s) => s.setPostTitle);
  const setPostContent = useBuildTeamStore((s) => s.setPostContent);

  const canSubmit = postTitle.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>모집글</Text>
        <Text style={styles.stepText}>{CURRENT_STEP}/{TOTAL_STEPS}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>모집 공고를 어필할 모집글을 작성해요</Text>

        {/* 제목 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            제목 <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.titleInput}
              placeholder="예) 금융 도메인에 관심있는 팀원 모집합니다!"
              placeholderTextColor={Colors.grayLight}
              value={postTitle}
              onChangeText={(t) => setPostTitle(t.slice(0, 50))}
              maxLength={50}
            />
            <Text style={styles.charCountInBox}>{postTitle.length} / 50자</Text>
          </View>
        </View>

        {/* 본문 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>본문</Text>
          <View style={[styles.inputBox, styles.contentBox]}>
            <TextInput
              style={styles.contentInput}
              placeholder={
                '예)\n저는 금융 도메인에 지식이 있고, 기획을 맡을 예정이에요.\n데이터나 개발 쪽 경험이 있는 분과 함께하고 싶어요. 발표에 자신있는 분도 환영해요!'
              }
              placeholderTextColor={Colors.grayLight}
              value={postContent}
              onChangeText={(t) => setPostContent(t.slice(0, 300))}
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.charCountInBox}>{postContent.length} / 300자</Text>
          </View>
        </View>

        {/* 작성 가이드 */}
        <View style={styles.guideSection}>
          <Text style={styles.guideSectionTitle}>작성 가이드</Text>
          {GUIDE_ITEMS.map((item) => (
            <View key={item.title} style={styles.guideItem}>
              <View style={styles.guideItemHeader}>
                <Text style={styles.guideIcon}>{item.icon}</Text>
                <Text style={styles.guideTitle}>{item.title}</Text>
              </View>
              <Text style={styles.guideDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.doneBtn, !canSubmit && styles.doneBtnDisabled]}
          onPress={() =>
            canSubmit &&
            router.push(`/explore/build-team/recruit-confirm?contestId=${contestId}` as never)
          }
          activeOpacity={canSubmit ? 0.85 : 1}
        >
          <Text style={[styles.doneBtnText, !canSubmit && styles.doneBtnTextDisabled]}>완료</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { width: 32 },
  backIcon: { fontSize: 28, color: Colors.dark, lineHeight: 32 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark,
  },
  stepText: {
    width: 32,
    textAlign: 'right',
    fontSize: 13,
    color: Colors.grayMedium,
  },

  // 진행 바
  progressBar: { height: 3, backgroundColor: Colors.lightGray },
  progressFill: { height: 3, backgroundColor: Colors.primary },

  // 본문
  content: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: Colors.dark, marginBottom: 24 },

  // 입력 섹션
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.dark, marginBottom: 8 },
  required: { color: Colors.primary },

  inputBox: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  titleInput: {
    fontSize: 15,
    color: Colors.dark,
    paddingVertical: 0,
  },
  contentBox: { minHeight: 180 },
  contentInput: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 22,
    flex: 1,
    minHeight: 120,
    paddingVertical: 0,
  },
  charCountInBox: {
    fontSize: 12,
    color: Colors.grayLight,
    textAlign: 'right',
    marginTop: 8,
  },

  // 작성 가이드
  guideSection: { marginTop: 8 },
  guideSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
  },
  guideItem: {
    backgroundColor: Colors.pageBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  guideItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guideIcon: { fontSize: 15 },
  guideTitle: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  guideTextWrap: { flex: 1 },
  guideDesc: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 19,
  },

  // 하단
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnDisabled: { backgroundColor: Colors.lightGray },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  doneBtnTextDisabled: { color: Colors.grayMedium },
});
