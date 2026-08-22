import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

type AgreementKey = 'required' | 'analytics';

// 약관 내용이 바뀌면 이 값만 올린다 (User.termsVersion으로 서버에 저장됨).
// 서버 UserService의 CURRENT_TERMS_VERSION과 반드시 같은 값으로 맞춰야 한다.
export const TERMS_VERSION = '2026-08-15';

const REQUIRED_DETAIL_ROWS = [
  {
    label: '수집항목',
    value:
      '협업 성향 프로필(학교·학과, 참여 목적, 프로젝트 참여 시간대, 온/오프라인 선호, 보유 기술·스택), ' +
      '학력 인증 정보(재학증명서·학생증 등), 활동/평가 데이터(상호 리뷰, 열정 지수, 지원·매칭 이력)',
  },
  { label: '수집 경로', value: '온보딩/프로필 작성, 인증 절차, 서비스 이용 중 자동 생성' },
  {
    label: '목적',
    value: '팀원 매칭, 추천 알고리즘 제공, 실제 대학생/취준생 여부 확인, 신뢰 기반 커뮤니티 운영, 매칭 품질 개선',
  },
  { label: '보유기간', value: '탈퇴 시까지 (학력 인증서류는 인증 목적 달성 후 즉시 파기)' },
];

const ANALYTICS_DETAIL_ROWS = [
  {
    label: '수집항목',
    value: '서비스 이용기록·기기정보(GA4/GTM/Clarity로 수집되는 접속기록, 쿠키, 행동데이터, 세션 녹화)',
  },
  { label: '수집 경로', value: '자동 수집' },
  { label: '목적', value: '서비스 품질 개선, 이용 패턴 분석' },
  { label: '보유기간', value: '수집일로부터 1년 또는 개인정보처리방침에 명시한 기간' },
];

function AgreementItem({
  required,
  title,
  checked,
  onToggle,
  expanded,
  onToggleExpand,
  rows,
}: {
  required?: boolean;
  title: string;
  checked: boolean;
  onToggle: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  rows: { label: string; value: string }[];
}) {
  return (
    <View style={styles.agreementItem}>
      <View style={styles.agreementItemRow}>
        <TouchableOpacity style={styles.agreementItemLeft} onPress={onToggle} activeOpacity={0.7}>
          <View style={[styles.checkbox, styles.checkboxSmall, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.agreementItemText}>
            <Text style={required ? styles.badgeRequired : styles.badgeOptional}>
              {required ? '[필수] ' : '[선택] '}
            </Text>
            {title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleExpand} hitSlop={8}>
          <Text style={styles.expandArrow}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>
      {expanded && (
        <View style={styles.agreementDetail}>
          {rows.map((row) => (
            <View key={row.label} style={styles.agreementDetailRow}>
              <Text style={styles.agreementDetailLabel}>{row.label}</Text>
              <Text style={styles.agreementDetailValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

interface AgreementSectionProps {
  requiredAgreed: boolean;
  analyticsAgreed: boolean;
  onChangeRequired: (v: boolean) => void;
  onChangeAnalytics: (v: boolean) => void;
}

// 가입/재동의 화면에서 공용으로 쓰는 필수·선택 동의 섹션. 체크 상태는 상위 화면이
// 들고 있어야(예: "시작하기" 버튼 활성화 조건) 해서 controlled 컴포넌트로 만든다.
export function AgreementSection({
  requiredAgreed,
  analyticsAgreed,
  onChangeRequired,
  onChangeAnalytics,
}: AgreementSectionProps) {
  const [expandedItem, setExpandedItem] = useState<AgreementKey | null>(null);
  const allAgreed = requiredAgreed && analyticsAgreed;
  const toggleAllAgreed = () => {
    const next = !allAgreed;
    onChangeRequired(next);
    onChangeAnalytics(next);
  };

  return (
    <View style={styles.agreementSection}>
      <TouchableOpacity style={styles.agreementAllRow} onPress={toggleAllAgreed} activeOpacity={0.7}>
        <View style={[styles.checkbox, allAgreed && styles.checkboxChecked]}>
          {allAgreed && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <Text style={styles.agreementAllText}>전체 동의합니다</Text>
      </TouchableOpacity>

      <View style={styles.agreementDivider} />

      <AgreementItem
        required
        title="서비스 이용약관 및 개인정보 수집·이용 동의"
        checked={requiredAgreed}
        onToggle={() => onChangeRequired(!requiredAgreed)}
        expanded={expandedItem === 'required'}
        onToggleExpand={() => setExpandedItem((k) => (k === 'required' ? null : 'required'))}
        rows={REQUIRED_DETAIL_ROWS}
      />
      <AgreementItem
        title="서비스 이용기록·기기정보 수집 동의 (분석 목적)"
        checked={analyticsAgreed}
        onToggle={() => onChangeAnalytics(!analyticsAgreed)}
        expanded={expandedItem === 'analytics'}
        onToggleExpand={() => setExpandedItem((k) => (k === 'analytics' ? null : 'analytics'))}
        rows={ANALYTICS_DETAIL_ROWS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  agreementSection: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    overflow: 'hidden',
  },
  agreementAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.pageBg,
  },
  agreementAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginLeft: 10,
  },
  agreementDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxSmall: {
    width: 18,
    height: 18,
    borderRadius: 5,
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxMark: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  agreementItem: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  agreementItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  agreementItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  agreementItemText: {
    fontSize: 13,
    color: Colors.dark,
    marginLeft: 10,
    flexShrink: 1,
  },
  badgeRequired: {
    fontWeight: '700',
    color: Colors.primary,
  },
  badgeOptional: {
    fontWeight: '700',
    color: Colors.gray,
  },
  expandArrow: {
    fontSize: 11,
    color: Colors.grayMedium,
  },
  agreementDetail: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  agreementDetailRow: {
    gap: 2,
  },
  agreementDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.grayMedium,
  },
  agreementDetailValue: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 17,
  },
});
