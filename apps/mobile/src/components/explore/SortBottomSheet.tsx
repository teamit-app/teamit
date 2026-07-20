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
import { SortOption } from '../../types/contest';

interface SortOptionItem {
  key: SortOption;
  label: string;
  description: string;
}

const SORT_OPTIONS: SortOptionItem[] = [
  {
    key: 'LATEST',
    label: '최신순',
    description: '가장 최근에 등록된 모집글 먼저',
  },
  {
    key: 'POPULAR',
    label: '인기순',
    description: '조회수와 채팅 수, 좋아요 수 기준으로 정렬',
  },
];

interface SortBottomSheetProps {
  visible: boolean;
  selectedSort: SortOption;
  onApply: (sort: SortOption) => void;
  onClose: () => void;
}

export function SortBottomSheet({
  visible,
  selectedSort,
  onApply,
  onClose,
}: SortBottomSheetProps) {
  const [tempSelected, setTempSelected] = useState<SortOption>(selectedSort);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setTempSelected(selectedSort)}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>정렬 기준</Text>

        <View style={styles.optionList}>
          {SORT_OPTIONS.map((option) => {
            const selected = tempSelected === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={styles.optionRow}
                onPress={() => setTempSelected(option.key)}
                activeOpacity={0.75}
              >
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDesc}>{option.description}</Text>
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
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.lightGray,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  optionList: {
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark,
    marginBottom: 3,
  },
  optionLabelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: 13,
    color: Colors.grayMedium,
  },
  checkmark: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: 12,
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
