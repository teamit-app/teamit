import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export interface FilterOption<T extends string> {
  key: T;
  label: string;
}

interface FilterPillsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  trailingLabel?: string;
  onPressTrailing?: () => void;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  trailingLabel,
  onPressTrailing,
}: FilterPillsProps<T>) {
  return (
    <View style={styles.container}>
      <View style={styles.pillRow}>
        {options.map((option) => {
          const active = option.key === value;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onChange(option.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {trailingLabel && (
        <TouchableOpacity style={styles.trailing} onPress={onPressTrailing} activeOpacity={0.8}>
          <Text style={styles.trailingLabel}>{trailingLabel} ▾</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray,
  },
  pillLabelActive: {
    color: Colors.white,
  },
  trailing: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  trailingLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray,
  },
});
