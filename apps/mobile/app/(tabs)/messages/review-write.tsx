import React, { useState } from 'react';
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
import { dummyChatRooms } from '../../../src/data/chatRooms';
import { useReviewStore } from '../../../src/store/useReviewStore';
import { postReview } from '../../../src/services/reviewService';
import { TeamMemberStatus } from '../../../src/types/message';

// ── 리뷰 옵션 데이터 ──────────────────────────────────────────────────────────
const TOTAL_RATING_OPTIONS = [
  { value: 5, label: '★★★★★', desc: '다음에도 꼭 함께하고 싶어요' },
  { value: 4, label: '★★★★☆', desc: '좋은 팀원이었어요' },
  { value: 3, label: '★★★☆☆', desc: '보통이었어요. 무난하게 함께할 수 있었어요' },
  { value: 2, label: '★★☆☆☆', desc: '아쉬운 점이 많았어요' },
  { value: 1, label: '★☆☆☆☆', desc: '다음에는 함께하기 어려울 것 같아요' },
];

const RESPONSE_SPEED_OPTIONS = [
  { value: '1시간 이내',  desc: '매우 빠름 · 거의 항상 즉각 답했어요' },
  { value: '반나절 이내', desc: '빠름 · 몇 시간 내로 답했어요' },
  { value: '하루 이내',   desc: '보통 · 하루 안에 답했어요' },
  { value: '이틀 이상',   desc: '느림 · 답장에 하루 넘게 걸렸어요' },
  { value: '잠수',        desc: '프로젝트 도중에 연락이 끊겼어요' },
];

const DEADLINE_OPTIONS = [
  { value: '항상 제때',   desc: '마감을 단 한번도 어기지 않았어요' },
  { value: '대부분 제때', desc: '대부분 기한 내에 완료했어요 (1회 지연)' },
  { value: '가끔 늦음',   desc: '몇 번(2~3회) 늦은 적이 있었어요' },
  { value: '자주 늦음',   desc: '자주(4회 이상) 마감을 지키지 못했어요' },
  { value: '항상 늦음',   desc: '한번도 마감을 지키지 않았어요' },
];

const INTENSITY_OPTIONS = [
  { value: '적극적 참여',   desc: '기대보다 훨씬 열정적으로 참여했어요' },
  { value: '보통 참여',     desc: '맡은 역할을 성실하게 다해줬어요' },
  { value: '소극적 참여',   desc: '참여도가 조금 아쉬웠어요' },
  { value: '참여하지 않음', desc: '전혀 참여하지 않았어요' },
];

const KEYWORD_OPTIONS = [
  '책임감 있어요',  '리더십이 있어요',      '소통이 빨라요',
  '꼼꼼하게 작업해요', '기술력이 뛰어나요',
  '아이디어가 넘쳐요', '일정 관리를 잘해요',
  '분위기 메이커예요', '피드백을 잘 수용해요',
];
const MAX_KEYWORDS = 3;

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

  const chat = dummyChatRooms.find((c) => c.id === chatIdNum);
  const MY_USER_ID = 1;
  const reviewableMembers: TeamMemberStatus[] =
    (chat?.teamInfo?.members ?? []).filter((m) => m.id !== MY_USER_ID);

  const { submitReview, getSubmittedReviews } = useReviewStore();
  const submitted = getSubmittedReviews(chatIdNum);
  const unreviewedMembers = reviewableMembers.filter(
    (m) => !submitted.find((r) => r.memberId === m.id)
  );

  // step 0 = 팀원 선택, steps 1-5 = 리뷰 질문
  // 미리뷰 팀원이 1명이면 바로 step 1 (자동 선택)
  const [step, setStep] = useState(unreviewedMembers.length === 1 ? 1 : 0);
  const [selectedMember, setSelectedMember] = useState<TeamMemberStatus | null>(
    unreviewedMembers.length === 1 ? unreviewedMembers[0] : null
  );

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
      case 5: return selectedKeywords.length > 0;
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
      submitReview(chatIdNum, {
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        totalRating,
        responseSpeed,
        deadlineCompletion,
        participationIntensity,
        keywords: selectedKeywords,
        comment,
      });
      router.replace({
        pathname: '/(tabs)/messages/review-complete' as never,
        params: { chatId, memberName: selectedMember.name },
      });
    } catch (e) {
      console.error('[ReviewWrite] 리뷰 제출 실패:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const alreadyReviewed = (memberId: number) =>
    submitted.some((r) => r.memberId === memberId);

  // ── 헤더 타이틀 ──
  const headerTitle = step === 0 ? '팀원 리뷰' : '팀원 리뷰 작성';

  // ── 단계별 메타 ──
  const STEP_META = [
    null,
    { stepLabel: '1단계 · 전체 평점',     title: `${selectedMember?.name ?? '팀원'}님과 함께한 경험, 총평은 어떤가요?`, showMemberSub: false, selectionLabel: '단일 선택' },
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
                      <Text style={[s.memberName, done && s.memberNameDone]}>{m.name}</Text>
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
              <Text style={s.stepSub}>{selectedMember.name}님에게 리뷰를 남기는 중이에요</Text>
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
        {step <= 1 ? (
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
