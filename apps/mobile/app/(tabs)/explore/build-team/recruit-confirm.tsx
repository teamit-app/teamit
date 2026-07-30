import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from '../../../../src/utils/alert';
import { Colors } from '../../../../src/constants/colors';
import { useBuildTeamStore } from '../../../../src/store/useBuildTeamStore';
import { useExploreStore } from '../../../../src/store/useExploreStore';
import { useMypageStore } from '../../../../src/store/useMypageStore';
import { getContestDetail, createPost, registerAsParticipant } from '../../../../src/services/contestService';
import { formatRegionsLabel } from '../../../../src/utils/region';
import { trackEvent } from '../../../../src/services/gtm';

const TOTAL_STEPS = 5;
const CURRENT_STEP = 5;

function ConfirmRow({
  label,
  value,
  onEdit,
  caption,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  caption?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
        {caption ? <Text style={styles.rowCaption}>{caption}</Text> : null}
      </View>
      {onEdit && (
        <TouchableOpacity onPress={onEdit} hitSlop={8} activeOpacity={0.7}>
          <Text style={styles.rowEdit}>수정</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RecruitConfirmScreen() {
  const insets = useSafeAreaInsets();
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const id = Number(contestId);

  const {
    recruitCount,
    requiredSkills,
    genderCondition,
    schoolCondition,
    experienceCondition,
    purposeCondition,
    postTitle,
    postContent,
  } = useBuildTeamStore();

  const [contestTitle, setContestTitle] = useState('');

  useEffect(() => {
    getContestDetail(id).then((d) => {
      setContestTitle(d.title);
    }).catch(() => {});
  }, [id]);

  const skillsText = requiredSkills.length > 0 ? requiredSkills.join('  ') : '없음';
  const postText = postContent
    ? `제목 : ${postTitle}\n\n본문 : ${postContent}`
    : `제목 : ${postTitle}`;

  // 활동 방식은 모집글에서 따로 받지 않는다 — 모집자 본인이 참여 카드(후보 등록)에서
  // 이미 밝힌 온오프라인 선호를 그대로 쓴다. 오프라인/혼합이면 그 카드에 적힌 활동
  // 가능 지역 기준으로 후보를 매칭하니, 시작 전에 같이 보여준다.
  const { matchingProfile, draftCard } = useMypageStore();
  const ownerCard = draftCard ?? matchingProfile;
  const ownerMeetingType = ownerCard?.onlineOfflinePref === 'ONLINE'
    ? '온라인'
    : ownerCard?.onlineOfflinePref === 'OFFLINE'
      ? '오프라인'
      : '혼합';
  const ownerRegionLabel = ownerCard && ownerCard.regions.length > 0
    ? formatRegionsLabel(ownerCard.regions)
    : '';
  const meetingTypeText = ownerMeetingType !== '온라인' && ownerRegionLabel
    ? `${ownerMeetingType} · ${ownerRegionLabel}`
    : ownerMeetingType;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const markContestParticipant = useExploreStore((s) => s.markContestParticipant);

  const goBack = () => router.back();

  const handleStart = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const today = new Date();
      const deadline = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const result = await createPost({
        contestId: id,
        postType: 'CONTEST',
        recruitMode: 'BUILD',
        title: postTitle || '팀원을 모집합니다',
        description: postContent || '',
        recruitCount,
        genderCondition: genderCondition === '동성만' ? 'SAME' : 'ANY',
        schoolCondition: schoolCondition === '학교 상관없음' ? 'ANY' : 'SAME_SCHOOL',
        onlineOffline: ownerCard?.onlineOfflinePref ?? 'MIXED',
        deadline,
        requiredSkills: requiredSkills.map((name) => ({ skillId: null, skillNameCustom: name })),
        experienceCondition,
        purposeCondition,
      });

      // 모집글 작성 성공 = 팀 채팅방도 함께 생성됨(서버가 한 번에 처리) — 이 시점이
      // 실제 "모집 시작" 완료 지점이라, 버튼 클릭이 아니라 여기서 이벤트를 보낸다.
      trackEvent('recruit_post_created', { contest_id: id, post_id: result?.postId ?? null });

      // 모집글 작성 = 팀 매칭 후보 자동 등록. 서버가 자동 등록할 때는 라이브 매칭
      // 프로필을 읽어서 스냅샷을 만드는데, 이 화면에서 "수정"으로 고친 내용은
      // draftCard에만 있고 라이브 프로필엔 없으므로, draft가 있으면 곧바로 그 값으로
      // 스냅샷을 덮어써준다(라이브 프로필 자체는 여전히 안 건드림).
      // 이 호출이 조용히 실패하면 모집자 프로필(라이브 프로필 기준, 비어있을 수 있음)이
      // 그대로 남아 "모집자 프로필이 안 보이는" 버그로 이어지므로, 한 번 재시도하고
      // 그래도 실패하면 최소한 로그는 남긴다.
      const draftCard = useMypageStore.getState().draftCard;
      if (draftCard) {
        try {
          await registerAsParticipant(id, draftCard);
        } catch {
          try {
            await registerAsParticipant(id, draftCard);
          } catch (e2) {
            console.error('[RecruitConfirm] 모집자 참여 카드 스냅샷 덮어쓰기 실패:', e2);
          }
        }
        useMypageStore.getState().clearDraftCard();
      }
      markContestParticipant(id); // 스토어 낙관적 업데이트

      router.push(`/explore/build-team/matching-loading?contestId=${contestId}&postId=${result?.postId ?? ''}` as never);
    } catch (e) {
      console.error('[RecruitConfirm] 모집글 생성 실패:', e);
      Alert.alert('모집글 작성 실패', '이미 이 공모전에 모집글을 작성했어요. 공모전당 모집글은 하나만 작성할 수 있어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>모집 조건 확인</Text>
        <Text style={styles.stepText}>{CURRENT_STEP}/{TOTAL_STEPS}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>모집 조건을 최종 확인해요</Text>
        <Text style={styles.pageSubtitle}>아래 내용이 모집글에 반영돼요</Text>

        {/* 통합 카드 */}
        <View style={styles.card}>
          <View style={styles.cardAccentBar} />
          <View style={styles.cardInner}>
            <Text style={styles.previewLabel}>모집 공고 미리보기</Text>
            <Text style={styles.contestTitle}>{contestTitle}</Text>
          </View>

          <ConfirmRow
            label="모집 인원"
            value={`${recruitCount}명`}
            onEdit={() => router.push(`/explore/build-team/recruit-count?contestId=${contestId}&returnToConfirm=true` as never)}
          />
          <ConfirmRow
            label="필요 기술"
            value={skillsText}
            onEdit={() => router.push(`/explore/build-team/recruit-skills?contestId=${contestId}&returnToConfirm=true` as never)}
          />
          <ConfirmRow
            label="성별·학교"
            value={`${genderCondition} / ${schoolCondition}`}
            onEdit={() => router.push(`/explore/build-team/recruit-conditions?contestId=${contestId}&returnToConfirm=true` as never)}
          />
          <ConfirmRow
            label="활동 방식"
            value={meetingTypeText}
            caption="참여 카드에 등록한 활동 방식이에요"
          />
          <ConfirmRow
            label="공모전 경험"
            value={experienceCondition}
            onEdit={() => router.push(`/explore/build-team/recruit-conditions?contestId=${contestId}&returnToConfirm=true` as never)}
          />
          <ConfirmRow
            label="참여 목적 우대"
            value={purposeCondition}
            onEdit={() => router.push(`/explore/build-team/recruit-conditions?contestId=${contestId}&returnToConfirm=true` as never)}
          />
          <ConfirmRow
            label="모집글"
            value={postText}
            onEdit={() => router.push(`/explore/build-team/recruit-post?contestId=${contestId}&returnToConfirm=true` as never)}
          />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>모집 시작하기</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  pageTitle: { fontSize: 20, fontWeight: '700', color: Colors.dark, marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: Colors.gray, marginBottom: 24 },

  // 통합 카드
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },
  cardAccentBar: { height: 5, backgroundColor: Colors.primary },
  cardInner: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
  },
  contestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },

  // 각 row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  rowLeft: { flex: 1 },
  rowLabel: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginBottom: 5,
  },
  rowValue: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 20,
  },
  rowCaption: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginTop: 3,
  },
  rowEdit: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    paddingTop: 18,
  },

  // 하단
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
