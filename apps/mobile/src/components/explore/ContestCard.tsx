import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Contest } from '../../types/contest';

interface ContestCardProps {
  contest: Contest;
  variant: 'compact' | 'full';
  onPressHeart?: () => void;
  onPressMatch?: () => void;
}

export function ContestCard({ contest, variant, onPressHeart, onPressMatch }: ContestCardProps) {
  const formattedDeadline = contest.endDate.replace(/-/g, '.');

  return (
    <View style={styles.card}>
      {variant === 'full' && (
        <View style={styles.row}>
          <View style={styles.thumbnail}>
            <Text style={styles.thumbnailText}>공모전{'\n'}이미지</Text>
          </View>
          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={styles.badgeRow}>
                {contest.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                <Text style={styles.organizer} numberOfLines={1}>{contest.organizer}</Text>
              </View>
              <TouchableOpacity onPress={onPressHeart} hitSlop={8}>
                <Text style={styles.heart}>{contest.isHearted ? '♥' : '♡'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title} numberOfLines={2}>{contest.title}</Text>

            <View style={styles.tagRow}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{contest.categoryLabel}</Text>
              </View>
              <View style={styles.dDayBadge}>
                <Text style={styles.dDayText}>D-{contest.dDay}</Text>
              </View>
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.deadline}>마감: {formattedDeadline}</Text>
              <TouchableOpacity style={styles.matchBtn} onPress={onPressMatch} activeOpacity={0.85}>
                <Text style={styles.matchBtnText}>매칭</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {variant === 'compact' && (
        <>
          <View style={styles.topRow}>
            <View style={styles.badgeRow}>
              {contest.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
              <Text style={styles.organizer} numberOfLines={1}>{contest.organizer}</Text>
            </View>
            <View style={styles.dDayBadge}>
              <Text style={styles.dDayText}>D-{contest.dDay}</Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>{contest.title}</Text>

          <View style={styles.bottomRow}>
            <Text style={styles.deadline}>마감: {formattedDeadline}</Text>
            <TouchableOpacity style={styles.matchBtn} onPress={onPressMatch} activeOpacity={0.85}>
              <Text style={styles.matchBtnText}>매칭</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 96,
    height: 130,
    borderRadius: 14,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  thumbnailText: {
    fontSize: 12,
    color: Colors.grayMedium,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  newBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  organizer: {
    fontSize: 12,
    color: Colors.grayMedium,
    flexShrink: 1,
  },
  heart: {
    fontSize: 20,
    color: Colors.dark,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginTop: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  categoryTag: {
    backgroundColor: Colors.pageBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryTagText: {
    fontSize: 12,
    color: Colors.gray,
  },
  dDayBadge: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  deadline: {
    fontSize: 12,
    color: Colors.grayMedium,
  },
  matchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  matchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
