import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { SegmentedTabs } from '../../../src/components/explore/SegmentedTabs';
import { SearchBar } from '../../../src/components/explore/SearchBar';
import { FilterPills } from '../../../src/components/explore/FilterPills';
import { ContestCard } from '../../../src/components/explore/ContestCard';
import { TalentCard } from '../../../src/components/explore/TalentCard';
import { useExploreStore } from '../../../src/store/useExploreStore';

type MainTab = 'POOL' | 'CONTEST';

export default function LikesScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: MainTab = params.tab === 'CONTEST' ? 'CONTEST' : 'POOL';

  const [mainTab, setMainTab] = useState<MainTab>(initialTab);
  const [keyword, setKeyword] = useState('');

  const talents = useExploreStore((s) => s.talents);
  const contests = useExploreStore((s) => s.contests);
  const loadData = useExploreStore((s) => s.loadData);
  const toggleTalentHeart = useExploreStore((s) => s.toggleTalentHeart);
  const toggleContestHeart = useExploreStore((s) => s.toggleContestHeart);

  useEffect(() => {
    loadData();
  }, []);

  const likedTalents = talents.filter(
    (talent) =>
      talent.isHearted &&
      (keyword.trim().length === 0 || talent.nickname.includes(keyword)),
  );
  const likedContests = contests.filter(
    (contest) =>
      contest.isHearted &&
      (keyword.trim().length === 0 || contest.title.includes(keyword)),
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="좋아요 목록"
        onBack={() => router.back()}
        rightElement={<Text style={styles.heartIcon}>♥</Text>}
      />

      <View style={styles.tabSwitchWrap}>
        <SegmentedTabs
          options={[
            { key: 'POOL', label: '인재풀' },
            { key: 'CONTEST', label: '공모전' },
          ]}
          value={mainTab}
          onChange={setMainTab}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SearchBar
          placeholder={mainTab === 'POOL' ? '이름, 역할, 스킬로 검색' : '공모전 이름, 주최기관, 분야 검색'}
          value={keyword}
          onChangeText={setKeyword}
        />

        {mainTab === 'POOL' && (
          <View style={styles.filterRow}>
            <FilterPills
              options={[{ key: 'ALL', label: '전체' }]}
              value="ALL"
              onChange={() => {}}
              trailingLabel="스킬별"
            />
          </View>
        )}

        <View style={styles.list}>
          {mainTab === 'POOL'
            ? likedTalents.map((talent) => (
                <TalentCard
                  key={talent.userId}
                  talent={talent}
                  onPressHeart={() => toggleTalentHeart(talent.userId)}
                />
              ))
            : likedContests.map((contest) => (
                <ContestCard
                  key={contest.contestId}
                  contest={contest}
                  variant="full"
                  onPressHeart={() => toggleContestHeart(contest.contestId)}
                />
              ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  heartIcon: {
    fontSize: 20,
    color: Colors.dark,
  },
  tabSwitchWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  filterRow: {
    marginTop: 14,
  },
  list: {
    marginTop: 16,
  },
});
