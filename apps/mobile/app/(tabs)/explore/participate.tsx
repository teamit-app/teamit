import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { dummyParticipationCard, dummyContestDetails } from '../../../src/data/recruitmentPosts';

interface CardRowProps {
  label: string;
  value: string;
  multiline?: boolean;
  onPressEdit: () => void;
}

function CardRow({ label, value, multiline, onPressEdit }: CardRowProps) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.left}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={[rowStyles.value, multiline && rowStyles.valueMultiline]}>{value}</Text>
      </View>
      <TouchableOpacity onPress={onPressEdit} hitSlop={8} activeOpacity={0.7}>
        <Text style={rowStyles.editText}>수정</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ParticipateScreen() {
  const insets = useSafeAreaInsets();
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const id = Number(contestId);

  const card = dummyParticipationCard;
  const detail = dummyContestDetails.find((d) => d.contestId === id) ?? dummyContestDetails[0];

  const handleEdit = () => {
    // 수정 화면은 현재 미구현
  };

  const handleSubmit = () => {
    router.push(`/explore/participate-complete?contestId=${id}` as never);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="참여 카드 확인" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>이렇게 등록할게요</Text>
        <Text style={styles.subtitle}>틀린 정보가 있으면 수정해 주세요</Text>

        {/* 참여 카드 미리보기 */}
        <View style={styles.cardWrap}>
          {/* 주황 상단 액센트 바 */}
          <View style={styles.cardAccentBar} />

          <View style={styles.cardInner}>
            <Text style={styles.cardPreviewLabel}>참여 카드 미리보기</Text>
            <Text style={styles.cardContestTitle}>{detail.title}</Text>

            <View style={styles.divider} />

            <CardRow label="스킬" value={card.skills} onPressEdit={handleEdit} />
            <CardRow label="목적" value={card.purpose} onPressEdit={handleEdit} />
            <CardRow label="강도" value={card.intensity} onPressEdit={handleEdit} />
            <CardRow
              label="온오프라인선호"
              value={`${card.meetingPreference} · ${card.location}`}
              onPressEdit={handleEdit}
            />
            <CardRow label="팀분위기" value={card.teamVibe} onPressEdit={handleEdit} />
            <CardRow label="리더십" value={card.leadership} onPressEdit={handleEdit} />

            {/* 어필글 */}
            <View style={rowStyles.row}>
              <View style={rowStyles.left}>
                <Text style={rowStyles.label}>어필글</Text>
                <Text style={rowStyles.appealTitle}>
                  제목: {card.appealTitle}
                </Text>
                <Text style={rowStyles.appealContent}>
                  내용: {card.appealContent}
                </Text>
              </View>
              <TouchableOpacity onPress={handleEdit} hitSlop={8} activeOpacity={0.7}>
                <Text style={rowStyles.editText}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 제출 버튼 */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>제출하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 20,
  },
  cardWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },
  cardAccentBar: {
    height: 5,
    backgroundColor: Colors.primary,
  },
  cardInner: {
    paddingTop: 16,
  },
  cardPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  cardContestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});

const rowStyles = StyleSheet.create({
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
  left: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 20,
  },
  valueMultiline: {
    lineHeight: 21,
  },
  editText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginTop: 1,
  },
  appealTitle: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 21,
    marginBottom: 4,
  },
  appealContent: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 21,
  },
});
