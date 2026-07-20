import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

// 0.5 단위 별점을 지원하는 별 아이콘 (예: 3.5 → ★★★⯨☆)
interface Props {
  value: number; // 0~5, 0.5 단위
  max?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
}

export function StarRating({ value, max = 5, size = 14, color = Colors.primary, emptyColor = '#E0E0E0' }: Props) {
  return (
    <View style={s.row}>
      {Array.from({ length: max }).map((_, i) => {
        const fillPct = Math.max(0, Math.min(1, value - i)) * 100;
        return (
          <View key={i} style={{ width: size, height: size, marginRight: 1 }}>
            <Text style={[s.base, { fontSize: size, color: emptyColor }]}>★</Text>
            <View style={[s.fillClip, { width: `${fillPct}%` as any }]}>
              <Text style={{ fontSize: size, color }}>★</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  base: { position: 'absolute', left: 0, top: 0 },
  fillClip: { position: 'absolute', left: 0, top: 0, height: '100%', overflow: 'hidden' },
});
