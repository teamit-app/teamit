import React, { useRef, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Colors } from '../../constants/colors';

const ITEM_HEIGHT = 44;
const VISIBLE = 5; // must be odd
const VISIBLE_HEIGHT = ITEM_HEIGHT * VISIBLE;
const CENTER_IDX = Math.floor(VISIBLE / 2);

interface DrumColumnProps {
  items: string[];
  initialIndex: number;
  onChange: (index: number) => void;
}

function DrumColumn({ items, initialIndex, onChange }: DrumColumnProps) {
  const ref = useRef<ScrollView>(null);
  const [selected, setSelected] = useState(initialIndex);

  useLayoutEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: initialIndex * ITEM_HEIGHT, animated: false });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    setSelected(clamped);
    onChange(clamped);
  };

  return (
    <View style={styles.columnWrap}>
      {/* selection highlight */}
      <View pointerEvents="none" style={styles.selectionHighlight} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.98}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * CENTER_IDX }}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
      >
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <Text style={[styles.itemText, i === selected && styles.selectedText]}>
              {item}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

interface DrumRollPickerProps {
  visible: boolean;
  initialYear?: number;
  initialMonth?: number;
  initialDay?: number;
  onConfirm: (year: number, month: number, day: number) => void;
  onCancel: () => void;
}

const YEARS = Array.from({ length: 41 }, (_, i) => `${1980 + i}년`);
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
const DAYS = Array.from({ length: 31 }, (_, i) => `${i + 1}일`);

export function DrumRollPicker({
  visible,
  initialYear = 2000,
  initialMonth = 1,
  initialDay = 1,
  onConfirm,
  onCancel,
}: DrumRollPickerProps) {
  const yearIdx = useRef(initialYear - 1980);
  const monthIdx = useRef(initialMonth - 1);
  const dayIdx = useRef(initialDay - 1);

  const handleConfirm = () => {
    onConfirm(
      1980 + yearIdx.current,
      monthIdx.current + 1,
      dayIdx.current + 1,
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>생년월일을 선택해 주세요</Text>
          <Text style={styles.subtitle}>스크롤하여 날짜를 선택하세요</Text>

          <View style={styles.pickerRow}>
            <DrumColumn
              items={YEARS}
              initialIndex={yearIdx.current}
              onChange={(i) => { yearIdx.current = i; }}
            />
            <DrumColumn
              items={MONTHS}
              initialIndex={monthIdx.current}
              onChange={(i) => { monthIdx.current = i; }}
            />
            <DrumColumn
              items={DAYS}
              initialIndex={dayIdx.current}
              onChange={(i) => { dayIdx.current = i; }}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  columnWrap: {
    flex: 1,
    height: VISIBLE_HEIGHT,
    overflow: 'hidden',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * CENTER_IDX,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: Colors.primary,
    zIndex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    color: Colors.textGray,
  },
  selectedText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: Colors.textGray,
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});
