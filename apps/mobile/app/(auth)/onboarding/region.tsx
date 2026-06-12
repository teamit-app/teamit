import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../src/constants/colors';
import { SIDO_LIST, SIGUNGU_MAP, Region, formatRegionLabel } from '../../../src/data/regions';
import { submitRegions } from '../../../src/services/onboardingService';
import { useOnboardingStore } from '../../../src/store/useOnboardingStore';

export default function RegionScreen() {
  const insets = useSafeAreaInsets();
  const userId = useOnboardingStore((s) => s.userId);

  const [activeSido, setActiveSido] = useState<string>(SIDO_LIST[0]);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);

  const sigunguList = SIGUNGU_MAP[activeSido] ?? [];

  const isRegionSelected = (sido: string, sigungu: string | null) =>
    selectedRegions.some((r) => r.sido === sido && r.sigungu === sigungu);

  const toggleRegion = (sido: string, sigungu: string | null) => {
    const already = isRegionSelected(sido, sigungu);
    if (already) {
      setSelectedRegions((prev) => prev.filter((r) => !(r.sido === sido && r.sigungu === sigungu)));
    } else {
      setSelectedRegions((prev) => [...prev, { sido, sigungu }]);
    }
  };

  const removeRegion = (region: Region) => {
    setSelectedRegions((prev) =>
      prev.filter((r) => !(r.sido === region.sido && r.sigungu === region.sigungu)),
    );
  };

  const handleNext = async () => {
    if (selectedRegions.length === 0 || loading) return;
    setLoading(true);
    try {
      await submitRegions(userId ?? 1, selectedRegions);
      router.push('/(auth)/onboarding/education');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 진행바 */}
      <View style={styles.progressBar}>
        <View style={[styles.progressStep, styles.progressActive]} />
        <View style={[styles.progressStep, styles.progressActive]} />
        <View style={styles.progressStep} />
      </View>

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기본 정보</Text>
        <View style={styles.backBtn} />
      </View>

      {/* 제목 */}
      <View style={styles.titleArea}>
        <Text style={styles.title}>활동 가능한 지역을 선택해 주세요</Text>
        <Text style={styles.subtitle}>복수 선택이 가능해요</Text>
      </View>

      {/* 선택된 지역 */}
      <View style={styles.selectedArea}>
        <Text style={styles.selectedLabel}>선택된 지역</Text>
        {selectedRegions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagContainer}
          >
            {selectedRegions.map((r, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{formatRegionLabel(r)}</Text>
                <TouchableOpacity
                  onPress={() => removeRegion(r)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.tagRemove}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 2단 지역 선택 */}
      <View style={styles.pickerContainer}>
        {/* 왼쪽: 시도 */}
        <FlatList
          style={styles.sidoList}
          data={SIDO_LIST}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: sido }) => (
            <TouchableOpacity
              style={[styles.sidoItem, activeSido === sido && styles.sidoItemActive]}
              onPress={() => setActiveSido(sido)}
            >
              <Text style={[styles.sidoText, activeSido === sido && styles.sidoTextActive]}>
                {sido}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* 오른쪽: 시군구 */}
        <FlatList
          style={styles.sigunguList}
          data={['전체', ...sigunguList]}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: sigungu }) => {
            const actualSigungu = sigungu === '전체' ? null : sigungu;
            const selected = isRegionSelected(activeSido, actualSigungu);
            return (
              <TouchableOpacity
                style={styles.sigunguItem}
                onPress={() => toggleRegion(activeSido, actualSigungu)}
              >
                <Text style={[styles.sigunguText, selected && styles.sigunguTextActive]}>
                  {sigungu}
                </Text>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 다음으로 버튼 */}
      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) }]}>
        <TouchableOpacity
          style={[styles.nextBtn, selectedRegions.length === 0 && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={selectedRegions.length === 0 || loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextText, selectedRegions.length === 0 && styles.nextTextDisabled]}>
            다음으로
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressBar: {
    flexDirection: 'row',
    height: 3,
  },
  progressStep: {
    flex: 1,
    backgroundColor: '#EEEEEE',
  },
  progressActive: {
    backgroundColor: Colors.primary,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 28,
    color: '#1A1A1A',
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  titleArea: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    color: '#999999',
  },
  selectedArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 56,
    backgroundColor: '#FFF2EB',
    borderTopWidth: 1,
    borderTopColor: '#FFD9C0',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD9C0',
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 8,
  },
  tagContainer: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
  },
  tagText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tagRemove: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
  },
  pickerContainer: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sidoList: {
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  sidoItem: {
    height: 46,
    justifyContent: 'center',
    paddingLeft: 16,
    backgroundColor: '#F8F8F8',
  },
  sidoItemActive: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  sidoText: {
    fontSize: 14,
    color: '#999999',
  },
  sidoTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  sigunguList: {
    width: '60%',
  },
  sigunguItem: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sigunguText: {
    fontSize: 14,
    color: '#333333',
  },
  sigunguTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  nextBtn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextTextDisabled: {
    color: '#AAAAAA',
  },
});
