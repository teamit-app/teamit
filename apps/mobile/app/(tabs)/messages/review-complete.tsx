import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { useReviewStore } from '../../../src/store/useReviewStore';
import { TeamMemberStatus } from '../../../src/types/message';
import { getChat } from '../../../src/services/messageService';
import { useAuthStore } from '../../../src/store/useAuthStore';

export default function ReviewCompleteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { chatId, memberName } = useLocalSearchParams<{ chatId: string; memberName: string }>();
  const chatIdNum = parseInt(chatId ?? '0');

  const MY_USER_ID = useAuthStore((state) => state.currentUserId) ?? 0;
  const [reviewableMembers, setReviewableMembers] = useState<TeamMemberStatus[]>([]);

  useEffect(() => {
    getChat(chatIdNum).then((chat) => {
      setReviewableMembers((chat?.teamInfo?.members ?? []).filter((m) => m.filled && m.id !== MY_USER_ID));
    }).catch(() => {});
  }, [chatIdNum, MY_USER_ID]);

  const { loadSubmitted, getSubmittedReceiverIds } = useReviewStore();
  useEffect(() => { loadSubmitted(chatIdNum); }, [chatIdNum]);
  const submittedCount  = getSubmittedReceiverIds(chatIdNum).length;
  const totalCount      = reviewableMembers.length;
  const allDone         = totalCount > 0 && submittedCount >= totalCount;

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      {/* 헤더 (뒤로가기 없음) */}
      <View style={s.header}>
        <Text style={s.headerTitle}>리뷰 완료</Text>
      </View>

      <View style={[s.body, { paddingBottom: insets.bottom + 16 }]}>

        {/* 완료 서클 */}
        <View style={s.checkCircle}>
          <Text style={s.checkMark}>✓</Text>
        </View>

        {/* 타이틀 */}
        <Text style={s.title}>리뷰 제출 완료!</Text>
        <Text style={s.subtitle}>{memberName ?? '팀원'}님에게 리뷰를 보냈어요.</Text>

        {/* 진행 현황 카드 */}
        <View style={s.progressCard}>
          <Text style={s.progressCardTitle}>리뷰 작성 현황</Text>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>작성 완료</Text>
            <Text style={s.progressValue}>
              <Text style={s.progressHighlight}>{submittedCount}</Text>
              {' / '}{totalCount}명
            </Text>
          </View>
        </View>

        {/* 잠금 / 완료 안내 카드 */}
        {allDone ? (
          <View style={[s.lockCard, s.unlockCard]}>
            <Text style={s.lockIcon}>🎉</Text>
            <Text style={[s.lockTitle, s.unlockTitle]}>모든 리뷰가 완료됐어요!</Text>
            <Text style={s.lockDesc}>이제 내가 받은 리뷰를 확인할 수 있어요.</Text>
          </View>
        ) : (
          <View style={s.lockCard}>
            <Text style={s.lockIcon}>🔒</Text>
            <Text style={s.lockTitle}>내 리뷰는 아직 잠겨 있어요</Text>
            <Text style={s.lockDesc}>
              팀원 모두에 대한 리뷰를 완료하면{'\n'}내가 받은 리뷰를 확인할 수 있어요.
            </Text>
          </View>
        )}

        {/* 버튼 그룹 */}
        <View style={s.btnGroup}>
          {/* 다음 팀원 리뷰하기 (아직 남은 팀원이 있을 때만) */}
          {!allDone && (
            <TouchableOpacity
              style={s.primaryBtn}
              activeOpacity={0.85}
              onPress={() =>
                router.replace({
                  pathname: '/(tabs)/messages/review-write' as never,
                  params: { chatId },
                })
              }
            >
              <Text style={s.primaryBtnText}>다음 팀원 리뷰하기</Text>
            </TouchableOpacity>
          )}

          {/* 받은 리뷰 확인하기 (모두 완료 시 활성화) */}
          <TouchableOpacity
            style={[s.secondaryBtn, !allDone && s.secondaryBtnDisabled]}
            disabled={!allDone}
            activeOpacity={allDone ? 0.85 : 1}
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/messages/my-reviews' as never,
                params: { chatId },
              })
            }
          >
            <Text style={[s.secondaryBtnText, !allDone && s.secondaryBtnTextDisabled]}>
              {!allDone ? '🔒  ' : ''}받은 리뷰 확인하기
            </Text>
          </TouchableOpacity>

          {/* 채팅방으로 돌아가기 */}
          <TouchableOpacity
            style={s.ghostBtn}
            activeOpacity={0.7}
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/messages/[chatId]' as never,
                params: { chatId },
              })
            }
          >
            <Text style={s.ghostBtnText}>채팅방으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },

  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 36,
    gap: 16,
  },

  // 체크 서클
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.ogTint,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  checkMark: { fontSize: 34, color: Colors.primary, fontWeight: '800' },

  title:    { fontSize: 22, fontWeight: '800', color: Colors.dark },
  subtitle: { fontSize: 14, color: Colors.grayMedium },

  // 진행 현황 카드
  progressCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  progressCardTitle: { fontSize: 13, color: Colors.grayMedium },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel:    { fontSize: 14, color: Colors.dark, fontWeight: '500' },
  progressValue:    { fontSize: 14, color: Colors.dark },
  progressHighlight:{ fontSize: 16, fontWeight: '800', color: Colors.primary },

  // 잠금 카드
  lockCard: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  unlockCard: { backgroundColor: Colors.ogTint },
  lockIcon:   { fontSize: 32 },
  lockTitle:  { fontSize: 15, fontWeight: '700', color: Colors.dark, textAlign: 'center' },
  unlockTitle:{ color: Colors.primary },
  lockDesc:   { fontSize: 13, color: Colors.grayMedium, textAlign: 'center', lineHeight: 20 },

  // 버튼 그룹
  btnGroup: { width: '100%', gap: 10, marginTop: 8 },

  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  secondaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  secondaryBtnText:         { fontSize: 15, fontWeight: '600', color: Colors.primary },
  secondaryBtnTextDisabled: { color: Colors.grayMedium },

  ghostBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: { fontSize: 14, color: Colors.grayMedium },
});
