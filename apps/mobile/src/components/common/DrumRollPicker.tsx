import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
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
  const webSnapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: initialIndex * ITEM_HEIGHT, animated: false });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => () => {
    if (webSnapTimer.current) clearTimeout(webSnapTimer.current);
  }, []);

  // snapToInterval만으로는 스크롤이 정확한 아이템 경계에 멈추지 않고 애매하게 걸치는
  // 경우가 있어(사용자 리포트), 네이티브 관성 스크롤이 완전히 멈춘 뒤 가장 가까운
  // 아이템 위치로 한 번 더 보정한다. 주의: 드래그를 놓는 시점(onScrollEndDrag)에는
  // 절대 스냅을 걸면 안 된다 — 그 시점엔 아직 관성(플릭) 스크롤이 이어지는 중일 수
  // 있는데, 여기서 scrollTo를 부르면 그 관성을 끊어버려서 사용자가 원하는 위치까지
  // 스크롤이 도달하기 전에 멈춰버리는 문제가 생긴다(이전 버그).
  const snapTo = (idx: number, animated: boolean) => {
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    setSelected(clamped);
    onChange(clamped);
    ref.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated });
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    snapTo(idx, true);
  };

  // 웹(react-native-web)은 관성 스크롤 개념이 없어 onMomentumScrollEnd/onScrollEndDrag가
  // 아예 호출되지 않고 onScroll만 스크롤 도중 계속 호출된다. 그래서 "스크롤이 멈췄다"를
  // 직접 감지해야 한다: onScroll이 올 때마다 타이머를 리셋하고, 일정 시간(120ms) 동안
  // 더 이상 onScroll이 안 오면 그때 비로소 가장 가까운 아이템으로 스냅한다.
  const handleWebScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const idx = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    setSelected(clamped);
    onChange(clamped);

    if (webSnapTimer.current) clearTimeout(webSnapTimer.current);
    webSnapTimer.current = setTimeout(() => {
      ref.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
    }, 120);
  };

  // 일(day) 컬럼처럼 월이 바뀌면 항목 수가 줄어들 수 있는 경우 — 예: 3월 31일을 선택한
  // 상태에서 4월로 바꾸면 31일이 없으므로, 그 달의 마지막 날로 자동으로 당겨준다.
  // (그대로 두면 "2024-04-31" 같은 존재하지 않는 날짜가 서버로 전송되어 등록이 실패한다)
  useEffect(() => {
    if (selected > items.length - 1) {
      const clamped = items.length - 1;
      setSelected(clamped);
      onChange(clamped);
      ref.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <View style={styles.columnWrap}>
      {/* selection highlight */}
      <View pointerEvents="none" style={styles.selectionHighlight} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.98}
        onMomentumScrollEnd={Platform.OS === 'web' ? undefined : handleMomentumScrollEnd}
        onScroll={Platform.OS === 'web' ? handleWebScroll : undefined}
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

// ─── Single-column picker (e.g. gender) ───────────────────────────────────────

interface SingleDrumPickerProps {
  visible: boolean;
  title?: string;
  items: string[];
  initialIndex?: number;
  onConfirm: (index: number, value: string) => void;
  onCancel: () => void;
}

export function SingleDrumPicker({
  visible,
  title,
  items,
  initialIndex = 0,
  onConfirm,
  onCancel,
}: SingleDrumPickerProps) {
  const idx = useRef(initialIndex);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={[styles.pickerRow, { justifyContent: 'center' }]}>
            <View style={{ width: 160, height: VISIBLE_HEIGHT }}>
              <DrumColumn
                items={items}
                initialIndex={initialIndex}
                onChange={(i) => { idx.current = i; }}
              />
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onConfirm(idx.current, items[idx.current])}
            >
              <Text style={styles.confirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Date picker ───────────────────────────────────────────────────────────────

interface DrumRollPickerProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  initialYear?: number;
  initialMonth?: number;
  initialDay?: number;
  onConfirm: (year: number, month: number, day: number) => void;
  onCancel: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => `${1980 + i}년`);
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

// month은 1~12, 해당 월의 실제 일수(윤년 2월도 정확히 계산)
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function DrumRollPicker({
  visible,
  title = '생년월일을 선택해 주세요',
  subtitle = '스크롤하여 날짜를 선택하세요',
  initialYear = 2000,
  initialMonth = 1,
  initialDay = 1,
  onConfirm,
  onCancel,
}: DrumRollPickerProps) {
  const [yearIdx, setYearIdx] = useState(initialYear - 1980);
  const [monthIdx, setMonthIdx] = useState(initialMonth - 1);
  const [dayIdx, setDayIdx] = useState(initialDay - 1);

  const selectedYear = 1980 + yearIdx;
  const selectedMonth = monthIdx + 1;
  // 존재하지 않는 날짜(2월 30일 등)를 고를 수 없도록 선택된 연/월 기준으로 일 목록을 매번 새로 계산한다
  const DAYS = useMemo(
    () => Array.from({ length: daysInMonth(selectedYear, selectedMonth) }, (_, i) => `${i + 1}일`),
    [selectedYear, selectedMonth],
  );

  const handleConfirm = () => {
    onConfirm(selectedYear, selectedMonth, dayIdx + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.pickerRow}>
            <DrumColumn
              items={YEARS}
              initialIndex={yearIdx}
              onChange={setYearIdx}
            />
            <DrumColumn
              items={MONTHS}
              initialIndex={monthIdx}
              onChange={setMonthIdx}
            />
            <DrumColumn
              items={DAYS}
              initialIndex={dayIdx}
              onChange={setDayIdx}
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
