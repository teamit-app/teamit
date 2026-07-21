import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { ContestCategory } from '../../types/contest';

export type CategoryFilter = ContestCategory | 'ALL';

interface CategoryOption {
  key: CategoryFilter;
  label: string;
  emoji: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'ALL', label: '전체', emoji: '📋' },
  { key: 'IT', label: 'IT·개발', emoji: '💻' },
  { key: 'STARTUP', label: '창업·비즈니스', emoji: '🚀' },
  { key: 'DESIGN', label: '디자인', emoji: '🎨' },
  { key: 'SOCIAL', label: '사회·환경', emoji: '🌱' },
  { key: 'ENGINEERING', label: '공학·기술', emoji: '⚙️' },
  { key: 'ARTS', label: '예술·문화', emoji: '🎭' },
  { key: 'MARKETING', label: '마케팅', emoji: '📢' },
  { key: 'ETC', label: '기타', emoji: '📌' },
];

interface CategoryFilterModalProps {
  visible: boolean;
  selectedCategory: CategoryFilter;
  onApply: (category: CategoryFilter) => void;
  onClose: () => void;
}

export function CategoryFilterModal({
  visible,
  selectedCategory,
  onApply,
  onClose,
}: CategoryFilterModalProps) {
  const [tempSelected, setTempSelected] = useState<CategoryFilter>(selectedCategory);

  const handleOpen = () => {
    setTempSelected(selectedCategory);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>분야별 필터</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.optionList}>
          {CATEGORY_OPTIONS.map((option) => {
            const selected = tempSelected === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={styles.optionRow}
                onPress={() => setTempSelected(option.key)}
                activeOpacity={0.75}
              >
                <View style={styles.optionLeft}>
                  <Text style={styles.emoji}>{option.emoji}</Text>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                </View>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => onApply(tempSelected)}
          activeOpacity={0.85}
        >
          <Text style={styles.applyBtnText}>적용하기</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
  },
  closeBtn: {
    fontSize: 18,
    color: Colors.gray,
  },
  optionList: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 20,
  },
  optionLabel: {
    fontSize: 16,
    color: Colors.dark,
    fontWeight: '400',
  },
  optionLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
  },
  applyBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
