import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { PoolUser } from '../../types/talent';

interface TalentCardProps {
  talent: PoolUser;
  onPressHeart?: () => void;
  onPressPropose?: () => void;
}

const GENDER_LABEL: Record<PoolUser['gender'], string> = {
  MALE: '남성',
  FEMALE: '여성',
};

export function TalentCard({ talent, onPressHeart, onPressPropose }: TalentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🧑‍💻</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{talent.nickname}</Text>
            <Text style={styles.gender}>{GENDER_LABEL[talent.gender]}</Text>
          </View>

          <View style={styles.schoolRow}>
            <Text style={styles.schoolText} numberOfLines={1}>
              {talent.schoolName} {talent.major}
            </Text>
            {talent.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedCheck}>✓</Text>
              </View>
            )}
          </View>

          {talent.certificates.length > 0 && (
            <Text style={styles.certificates} numberOfLines={1}>
              {talent.certificates.join('·')}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={onPressHeart} hitSlop={8} style={styles.heartBtn}>
          <Text style={styles.heart}>{talent.isHearted ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.skillRow}>
          {talent.skills.map((skill) => (
            <View key={skill.skillName} style={styles.skillTag}>
              <Text style={styles.skillTagText}>{skill.skillName}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.proposeBtn} onPress={onPressPropose} activeOpacity={0.85}>
          <Text style={styles.proposeBtnText}>제안하기</Text>
        </TouchableOpacity>
      </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nickname: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  gender: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  schoolText: {
    fontSize: 13,
    color: Colors.grayMedium,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },
  certificates: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginTop: 2,
  },
  heartBtn: {
    paddingLeft: 8,
  },
  heart: {
    fontSize: 20,
    color: Colors.dark,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  skillRow: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: Colors.pageBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  skillTagText: {
    fontSize: 12,
    color: Colors.dark,
  },
  proposeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginLeft: 8,
  },
  proposeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
