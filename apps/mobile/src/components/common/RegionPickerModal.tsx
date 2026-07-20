import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { SIDO_LIST, SIGUNGU_MAP } from '../../data/regions';
import { UserRegion } from '../../types/mypage';

interface Props {
  visible: boolean;
  initialRegions?: UserRegion[];
  onConfirm: (regions: UserRegion[]) => void;
  onCancel: () => void;
}

export function RegionPickerModal({
  visible,
  initialRegions = [],
  onConfirm,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const [viewingSido, setViewingSido] = useState(initialRegions[0]?.sido ?? '서울');
  const [selectedRegions, setSelectedRegions] = useState<UserRegion[]>(initialRegions);
  const sigunguListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setSelectedRegions(initialRegions);
      setViewingSido(initialRegions[0]?.sido ?? '서울');
    }
  }, [visible]);

  const sigunguList = ['전체', ...(SIGUNGU_MAP[viewingSido] ?? [])];

  // 현재 보고 있는 시도의 선택된 시군구 목록
  const isSigunguSelected = (item: string) => {
    const sigungu = item === '전체' ? null : item;
    return selectedRegions.some((r) => r.sido === viewingSido && r.sigungu === sigungu);
  };

  const handleSidoSelect = (sido: string) => {
    setViewingSido(sido);
    sigunguListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const handleSigunguToggle = (item: string) => {
    const sigungu = item === '전체' ? null : item;
    const alreadySelected = selectedRegions.some(
      (r) => r.sido === viewingSido && r.sigungu === sigungu,
    );
    if (alreadySelected) {
      setSelectedRegions((prev) =>
        prev.filter((r) => !(r.sido === viewingSido && r.sigungu === sigungu)),
      );
    } else if (sigungu === null) {
      // '전체' 선택 시 같은 시도의 개별 시군구 선택은 모두 무의미해지므로 정리한다
      setSelectedRegions((prev) => [
        ...prev.filter((r) => r.sido !== viewingSido),
        { sido: viewingSido, sigungu: null },
      ]);
    } else {
      // 개별 시군구 선택 시 같은 시도의 '전체' 선택은 더 이상 맞지 않으므로 해제한다
      setSelectedRegions((prev) => [
        ...prev.filter((r) => !(r.sido === viewingSido && r.sigungu === null)),
        { sido: viewingSido, sigungu },
      ]);
    }
  };

  const removeRegion = (r: UserRegion) => {
    setSelectedRegions((prev) =>
      prev.filter((x) => !(x.sido === r.sido && x.sigungu === r.sigungu)),
    );
  };

  const regionLabel = (r: UserRegion) =>
    r.sigungu ? `${r.sido} ${r.sigungu}` : `${r.sido} 전체`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
        {/* 핸들 */}
        <View style={styles.handle} />

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>활동 가능 지역</Text>
        </View>

        {/* 선택된 지역 칩들 */}
        <View style={styles.chipArea}>
          <Text style={styles.chipAreaLabel}>선택된 지역</Text>
          {selectedRegions.length === 0 ? (
            <Text style={styles.chipEmpty}>선택된 지역이 없어요</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
            >
              {selectedRegions.map((r, idx) => (
                <View key={idx} style={styles.chip}>
                  <Text style={styles.chipText}>{regionLabel(r)}</Text>
                  <TouchableOpacity
                    onPress={() => removeRegion(r)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.chipRemove}> ✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 2-column 피커 */}
        <View style={styles.picker}>
          {/* 시도 컬럼 */}
          <FlatList
            style={styles.sidoCol}
            data={SIDO_LIST}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isViewing = item === viewingSido;
              return (
                <TouchableOpacity
                  style={[styles.sidoItem, isViewing && styles.sidoItemViewing]}
                  onPress={() => handleSidoSelect(item)}
                >
                  <Text style={[styles.sidoText, isViewing && styles.sidoTextViewing]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* 구분선 */}
          <View style={styles.colDivider} />

          {/* 시군구 컬럼 */}
          <FlatList
            ref={sigunguListRef}
            style={styles.sigunguCol}
            data={sigunguList}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const selected = isSigunguSelected(item);
              return (
                <TouchableOpacity
                  style={[styles.sigunguItem, selected && styles.sigunguItemSelected]}
                  onPress={() => handleSigunguToggle(item)}
                >
                  <Text style={[styles.sigunguText, selected && styles.sigunguTextSelected]}>
                    {item}
                  </Text>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* 확인 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => onConfirm(selectedRegions)}
          >
            <Text style={styles.confirmBtnText}>
              확인{selectedRegions.length > 0 ? ` (${selectedRegions.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '68%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
  },

  // 선택된 지역 칩 영역
  chipArea: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    minHeight: 50,
    justifyContent: 'center',
  },
  chipAreaLabel: {
    fontSize: 11,
    color: Colors.grayMedium,
    marginBottom: 6,
  },
  chipEmpty: { fontSize: 13, color: Colors.grayMedium },
  chipScroll: { gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ogTint,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  chipRemove: { fontSize: 12, color: Colors.primary },

  // 2-column 피커
  picker: {
    flexDirection: 'row',
    flex: 1,
  },
  sidoCol: {
    flex: 1,
  },
  colDivider: {
    width: 1,
    backgroundColor: Colors.lightGray,
  },
  sigunguCol: {
    flex: 1,
  },

  // 시도 아이템
  sidoItem: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidoItemViewing: {
    backgroundColor: Colors.ogTint,
  },
  sidoText: { fontSize: 14, color: Colors.dark },
  sidoTextViewing: { color: Colors.primary, fontWeight: '700' },
  sidoBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidoBadgeText: { fontSize: 10, color: Colors.white, fontWeight: '700' },

  // 시군구 아이템
  sigunguItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    justifyContent: 'space-between',
  },
  sigunguItemSelected: {
    backgroundColor: '#FFF6F0',
  },
  sigunguText: { fontSize: 14, color: Colors.dark },
  sigunguTextSelected: { color: Colors.primary, fontWeight: '600' },
  checkmark: { fontSize: 13, color: Colors.primary, fontWeight: '700' },

  // 하단 버튼
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  confirmBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
