import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { useReviewStore } from '../../../src/store/useReviewStore';
import { postReview } from '../../../src/services/reviewService';
import { TeamMemberStatus } from '../../../src/types/message';
import { getChat } from '../../../src/services/messageService';
import { useAuthStore } from '../../../src/store/useAuthStore';
import {
  TOTAL_RATING_OPTIONS,
  RESPONSE_SPEED_OPTIONS,
  DEADLINE_OPTIONS,
  INTENSITY_OPTIONS,
} from '../../../src/constants/reviewOptions';

const KEYWORD_OPTIONS = [
  '책임감 있어요',  '리더십이 있어요',      '소통이 빨라요',
  '꼼꼼하게 작업해요', '기술력이 뛰어나요',
  '아이디어가 넘쳐요', '일정 관리를 잘해요',
  '분위기 메이커예요', '피드백을 잘 수용해요',
];
const MAX_KEYWORDS = 3;

// 리뷰 작성 중엔 누구인지 명확히 알 수 있도록 "닉네임(본명)"으로 표기
const formatMemberName = (name: string, realName?: string) =>
  realName ? `${name}(${realName})` : name;

// ── 진행 바 (steps 1–5만 표시) ────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  if (step < 1) return null;
  return (
    <View style={pb.wrap}>
      <View style={pb.track}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[pb.seg, i <= step && pb.segActive]} />
        ))}
      </View>
      <Text style={pb.label}>{step} / 5</Text>
    </View>
  );
}
const pb = StyleSheet.create({
  wrap:      { paddingHorizontal: 20, paddingBottom: 4 },
  track:     { flexDirection: 'row', gap: 4, marginBottom: 6 },
  seg:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E8E8E8' },
  segActive: { backgroundColor: Colors.primary },
  label:     { fontSize: 12, color: Colors.grayMedium },
});

// ── 라디오 선택 카드 ──────────────────────────────────────────────────────────
function RadioCard({
  label, desc, selected, onPress,
}: {
  label: string; desc?: string; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[rc.card, selected && rc.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[rc.radio, selected && rc.radioSelected]}>
        {selected && <Text style={rc.radioCheck}>✓</Text>}
      </View>
      <View style={rc.textGroup}>
        <Text style={[rc.label, selected && rc.labelSelected]}>{label}</Text>
        {desc ? <Text style={[rc.desc, selected && rc.descSelected]}>{desc}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}
const rc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: Colors.ogTint },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#BDBDBD',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  radioSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  radioCheck: { fontSize: 13, color: Colors.white, fontWeight: '800', lineHeight: 16 },
  textGroup:    { flex: 1, gap: 2 },
  label:        { fontSize: 15, fontWeight: '600', color: Colors.dark },
  labelSelected:{ color: Colors.primary },
  desc:         { fontSize: 13, color: Colors.grayMedium },
  descSelected: { color: Colors.primary },
});

// ── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function ReviewWriteScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const chatIdNum  = parseInt(chatId ?? '0');

  const MY_USER_ID = useAuthStore((state) => state.currentUserId) ?? 0;
  const [reviewableMembers, setReviewableMembers] = useState<TeamMemberStatus[]>([]);

  useEffect(() => {
    getChat(chatIdNum).then((chat) => {
      const members = (chat?.teamInfo?.members ?? []).filter((m) => m.filled && m.id !== MY_USER_ID);
      setReviewableMembers(members);
    }).catch(() => {});
  }, [chatIdNum, MY_USER_ID]);

  const { loadSubmitted, markSubmitted, getSubmittedReceiverIds } = useReviewStore();
  useEffect(() => { loadSubmitted(chatIdNum); }, [chatIdNum]);
  const submitted = getSubmittedReceiverIds(chatIdNum);
  const unreviewedMembers = reviewableMembers.filter((m) => !submitted.includes(m.id));
  const allDone = reviewableMembers.length > 0 && unreviewedMembers.length === 0;

  const [step, setStep] = useState(0);
  const [selectedMember, setSelectedMember] = useState<TeamMemberStatus | null>(null);

  const [totalRating,            setTotalRating]            = useState(0);
  const [responseSpeed,          setResponseSpeed]          = useState('');
  const [deadlineCompletion,     setDeadlineCompletion]     = useState('');
  const [participationIntensity, setParticipationIntensity] = useState('');
  const [selectedKeywords,       setSelectedKeywords]       = useState<string[]>([]);
  const [comment,                setComment]                = useState('');
  const [isSubmitting,           setIsSubmitting]           = useState(false);

  const resetInputs = () => {
    setTotalRating(0);
    setResponseSpeed('');
    setDeadlineCompletion('');
    setParticipationIntensity('');
    setSelectedKeywords([]);
    setComment('');
  };

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(kw)) return prev.filter((k) => k !== kw);
      if (prev.length >= MAX_KEYWORDS) return prev;
      return [...prev, kw];
    });
  };

  const canNext = (): boolean => {
    switch (step) {
      case 0: return selectedMember !== null;
      case 1: return totalRating > 0;
      case 2: return responseSpeed !== '';
      case 3: return deadlineCompletion !== '';
      case 4: return participationIntensity !== '';
      case 5: return true; // 장점 키워드·한 줄 리뷰 모두 선택 입력
      default: return false;
    }
  };

  const handleBack = () => {
    if (step === 0) { router.back(); return; }
    setStep((s) => s - 1);
  };

  const handleNext = async () => {
    if (step < 5) { setStep((s) => s + 1); return; }

    // step 5 → 제출
    if (!selectedMember || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await postReview(chatIdNum, {
        receiverId: selectedMember.id,
        totalRating,
        responseSpeed,
        deadlineCompletion,
        participationIntensity,
        keywords: selectedKeywords,
        comment,
      });
      markSubmitted(chatIdNum, selectedMember.id);
      router.replace({
        pathname: '/(tabs)/messages/review-complete' as never,
        params: { chatId, memberName: formatMemberName(selectedMember.name, selectedMember.realName) },
      });
    } catch (e) {
      console.error('[ReviewWrite] 리뷰 제출 실패:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const alreadyReviewed = (memberId: number) => submitted.includes(memberId);

  // ── 헤더 타이틀 ──
  const headerTitle = step === 0 ? '팀원 리뷰' : '팀원 리뷰 작성';

  // ── 단계별 메타 ──
  const STEP_META = [
    null,
    { stepLabel: '1단계 · 전체 평점',     title: `${selectedMember ? formatMemberName(selectedMember.name, selectedMember.realName) : '팀원'}님과 함께한 경험, 총평은 어떤가요?`, showMemberSub: false, selectionLabel: '단일 선택' },
    { stepLabel: '2단계 · 연락 응답 속도', title: '평균 응답 속도는 어땠나요?',  showMemberSub: true, selectionLabel: '단일 선택' },
    { stepLabel: '3단계 · 마감 기한 완수', title: '마감 기한을 얼마나 잘 지켰나요?', showMemberSub: true, selectionLabel: '단일 선택' },
    { stepLabel: '4단계 · 참여 강도',      title: '전반적인 참여도는 어땠나요?', showMemberSub: true, selectionLabel: '단일 선택' },
    { stepLabel: '5단계 · 장점',           title: '어떤 점이 좋았나요?',          showMemberSub: true, selectionLabel: `최대 ${MAX_KEYWORDS}개 선택` },
  ];
  const meta = step >= 1 ? STEP_META[step] : null;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 진행 바 */}
      <ProgressBar step={step} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 0: 팀원 선택 ─────────────────────────────────── */}
        {step === 0 && (
          <>
            <Text style={s.stepTitle}>누구를 리뷰할까요?</Text>
            <View style={s.optionList}>
              {reviewableMembers.map((m) => {
                const done     = alreadyReviewed(m.id);
                const isSelected = selectedMember?.id === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.memberCard, isSelected && s.memberCardSelected, done && s.memberCardDone]}
                    onPress={() => !done && setSelectedMember(m)}
                    activeOpacity={done ? 1 : 0.85}
                  >
                    <Text style={s.memberAvatar}>{m.avatar}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.memberName, done && s.memberNameDone]}>{formatMemberName(m.name, m.realName)}</Text>
                      <Text style={s.memberRole}>{m.role}</Text>
                    </View>
                    {done ? (
                      <View style={s.doneBadge}>
                        <Text style={s.doneBadgeText}>작성 완료</Text>
                      </View>
                    ) : isSelected ? (
                      <Text style={{ fontSize: 18, color: Colors.primary }}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── Steps 1–5: 리뷰 질문 ──────────────────────────────── */}
        {step >= 1 && meta && (
          <>
            <Text style={s.stepLabel}>{meta.stepLabel}</Text>
            <Text style={s.stepTitle}>{meta.title}</Text>
            {meta.showMemberSub && selectedMember && (
              <Text style={s.stepSub}>{formatMemberName(selectedMember.name, selectedMember.realName)}님에게 리뷰를 남기는 중이에요</Text>
            )}
            <Text style={s.selectionLabel}>{meta.selectionLabel}</Text>
          </>
        )}

        {/* Step 1: 전체 평점 */}
        {step === 1 && (
          <View style={s.optionList}>
            {TOTAL_RATING_OPTIONS.map((opt) => (
              <RadioCard
                key={opt.value}
                label={opt.label}
                desc={opt.desc}
                selected={totalRating === opt.value}
                onPress={() => setTotalRating(opt.value)}
              />
            ))}
          </View>
        )}

        {/* Step 2: 연락 응답 속도 */}
        {step === 2 && (
          <View style={s.optionList}>
            {RESPONSE_SPEED_OPTIONS.map((opt) => (
              <RadioCard
                key={opt.value}
                label={opt.value}
                desc={opt.desc}
                selected={responseSpeed === opt.value}
                onPress={() => setResponseSpeed(opt.value)}
              />
            ))}
          </View>
        )}

        {/* Step 3: 마감 기한 완수 */}
        {step === 3 && (
          <View style={s.optionList}>
            {DEADLINE_OPTIONS.map((opt) => (
              <RadioCard
                key={opt.value}
                label={opt.value}
                desc={opt.desc}
                selected={deadlineCompletion === opt.value}
                onPress={() => setDeadlineCompletion(opt.value)}
              />
            ))}
          </View>
        )}

        {/* Step 4: 참여 강도 */}
        {step === 4 && (
          <View style={s.optionList}>
            {INTENSITY_OPTIONS.map((opt) => (
              <RadioCard
                key={opt.value}
                label={opt.value}
                desc={opt.desc}
                selected={participationIntensity === opt.value}
                onPress={() => setParticipationIntensity(opt.value)}
              />
            ))}
          </View>
        )}

        {/* Step 5: 장점 선택 + 한 줄 리뷰 */}
        {step === 5 && (
          <View style={{ gap: 28 }}>
            {/* 장점 키워드 */}
            <View style={s.kwWrap}>
              {KEYWORD_OPTIONS.map((kw) => {
                const isSelected = selectedKeywords.includes(kw);
                const maxReached = selectedKeywords.length >= MAX_KEYWORDS && !isSelected;
                return (
                  <TouchableOpacity
                    key={kw}
                    style={[s.kwPill, isSelected && s.kwPillSelected, maxReached && s.kwPillDisabled]}
                    onPress={() => toggleKeyword(kw)}
                    activeOpacity={maxReached ? 1 : 0.8}
                  >
                    <Text style={[s.kwText, isSelected && s.kwTextSelected]}>{kw}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 한 줄 리뷰 */}
            <View>
              <View style={s.commentHeader}>
                <Text style={s.commentStepLabel}>6단계 · 한 줄 리뷰</Text>
                <View style={s.commentTitleRow}>
                  <Text style={s.commentTitle}>이 팀원에게 한 마디 남겨주세요</Text>
                  <View style={s.optionalBadge}>
                    <Text style={s.optionalBadgeText}>선택</Text>
                  </View>
                </View>
              </View>
              <View style={s.commentBox}>
                <TextInput
                  style={s.commentInput}
                  placeholder="함께해서 즐거웠어요! 팀원님 덕분에 좋은 결과를 낼 수 있었습니다!"
                  placeholderTextColor="#BDBDBD"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={100}
                  textAlignVertical="top"
                />
                <Text style={s.commentCount}>{comment.length} / 100</Text>
              </View>
              <Text style={s.commentNotice}>
                📣  한 줄 리뷰는 상대의 프로필에 닉네임 + 공모전명과 함께 공개됩니다.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        {step === 0 && allDone ? (
          // 모든 팀원 리뷰 완료 → 다음으로 대신 내 리뷰 확인하기
          <View style={s.allDoneWrap}>
            <Text style={s.allDoneText}>🎉 모든 팀원 리뷰를 완료했어요!</Text>
            <TouchableOpacity
              style={s.nextBtn}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/messages/my-reviews' as never,
                  params: { chatId },
                })
              }
              activeOpacity={0.85}
            >
              <Text style={s.nextBtnText}>내 리뷰 확인하기</Text>
            </TouchableOpacity>
          </View>
        ) : step <= 1 ? (
          // Step 0, 1: 다음으로만
          <TouchableOpacity
            style={[s.nextBtn, !canNext() && s.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canNext()}
            activeOpacity={0.85}
          >
            <Text style={[s.nextBtnText, !canNext() && s.nextBtnTextDisabled]}>다음으로</Text>
          </TouchableOpacity>
        ) : (
          // Steps 2–5: 이전 + 다음으로 (step 5는 제출)
          <View style={s.btnRow}>
            <TouchableOpacity style={s.prevBtn} onPress={handleBack} activeOpacity={0.8}>
              <Text style={s.prevBtnText}>이전</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.nextBtnFlex, (!canNext() || isSubmitting) && s.nextBtnDisabled]}
              onPress={handleNext}
              disabled={!canNext() || isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={[s.nextBtnText, (!canNext() || isSubmitting) && s.nextBtnTextDisabled]}>
                {step === 5 && isSubmitting ? '제출 중...' : step === 5 ? '제출' : '다음으로'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 4,
  },
  backBtn:     { width: 36, alignItems: 'flex-start' },
  backIcon:    { fontSize: 26, color: Colors.dark, lineHeight: 30 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  // step label / title / sub
  stepLabel:      { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  stepTitle:      { fontSize: 20, fontWeight: '800', color: Colors.dark, lineHeight: 28, marginBottom: 6 },
  stepSub:        { fontSize: 13, color: Colors.grayMedium, marginBottom: 6 },
  selectionLabel: { fontSize: 12, color: Colors.grayMedium, marginBottom: 14 },

  optionList: { gap: 10 },

  // 팀원 선택 카드
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 12,
  },
  memberCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.ogTint },
  memberCardDone:     { opacity: 0.45 },
  memberAvatar:       { fontSize: 28 },
  memberName:         { fontSize: 15, fontWeight: '700', color: Colors.dark },
  memberNameDone:     { color: Colors.grayMedium },
  memberRole:         { fontSize: 13, color: Colors.grayMedium, marginTop: 2 },
  doneBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  doneBadgeText: { fontSize: 11, color: '#388E3C', fontWeight: '600' },

  // Step 5 키워드
  kwWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kwPill: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: Colors.white,
  },
  kwPillSelected: { borderColor: Colors.primary, backgroundColor: Colors.ogTint },
  kwPillDisabled: { opacity: 0.45 },
  kwText:         { fontSize: 13, color: Colors.dark },
  kwTextSelected: { color: Colors.primary, fontWeight: '700' },

  // Step 5 한 줄 리뷰
  commentHeader:   { marginBottom: 10, gap: 2 },
  commentStepLabel:{ fontSize: 13, fontWeight: '700', color: Colors.primary },
  commentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentTitle:    { fontSize: 17, fontWeight: '700', color: Colors.dark },
  optionalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  optionalBadgeText: { fontSize: 11, color: Colors.grayMedium, fontWeight: '600' },
  commentBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.white,
    minHeight: 100,
  },
  commentInput:  { fontSize: 14, color: Colors.dark, lineHeight: 22, minHeight: 72 },
  commentCount:  { fontSize: 12, color: Colors.grayMedium, textAlign: 'right', marginTop: 6 },
  commentNotice: { fontSize: 12, color: Colors.grayMedium, marginTop: 8 },

  // 하단 버튼
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled:  { backgroundColor: '#E0E0E0' },
  nextBtnText:      { fontSize: 16, fontWeight: '700', color: Colors.white },
  nextBtnTextDisabled: { color: '#AAAAAA' },

  allDoneWrap:  { gap: 10 },
  allDoneText:  { fontSize: 14, fontWeight: '700', color: Colors.primary, textAlign: 'center' },

  btnRow: { flexDirection: 'row', gap: 10 },
  prevBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  prevBtnText:  { fontSize: 16, fontWeight: '600', color: Colors.dark },
  nextBtnFlex: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
