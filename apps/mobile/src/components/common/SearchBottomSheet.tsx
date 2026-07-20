import React, { useState, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface SearchBottomSheetProps {
  visible: boolean;
  title: string;
  placeholder: string;
  items: string[];
  onSelect: (item: string) => void;
  onClose: () => void;
  allowCustomInput?: boolean;
  customInputLabel?: string;
  customInputPlaceholder?: string;
}

export function SearchBottomSheet({
  visible,
  title,
  placeholder,
  items,
  onSelect,
  onClose,
  allowCustomInput = false,
  customInputLabel,
  customInputPlaceholder,
}: SearchBottomSheetProps) {
  const [keyword, setKeyword] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const customInputRef = useRef<TextInput>(null);

  const filtered = useMemo(
    () => items.filter((s) => s.includes(keyword)),
    [items, keyword],
  );

  const handleClose = () => {
    setKeyword('');
    setCustomMode(false);
    setCustomValue('');
    onClose();
  };

  const handleSelect = (item: string) => {
    setKeyword('');
    setCustomMode(false);
    setCustomValue('');
    onSelect(item);
  };

  const enterCustomMode = () => {
    setCustomMode(true);
    setCustomValue('');
    setTimeout(() => customInputRef.current?.focus(), 100);
  };

  const confirmCustom = () => {
    if (customValue.trim()) {
      handleSelect(customValue.trim());
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* drag indicator */}
            <View style={styles.indicator} />

            {/* header */}
            <View style={styles.header}>
              {customMode ? (
                <TouchableOpacity onPress={() => setCustomMode(false)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.backBtn} />
              )}
              <Text style={styles.title}>{customMode ? (customInputLabel ?? '직접 입력') : title}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeBtn}>닫기</Text>
              </TouchableOpacity>
            </View>

            {customMode ? (
              /* ── 직접 입력 모드 ── */
              <View style={styles.customModeWrap}>
                <Text style={styles.customModeDesc}>
                  목록에 없는 학과명을 직접 입력하세요
                </Text>
                <View style={styles.customInputWrap}>
                  <TextInput
                    ref={customInputRef}
                    style={styles.customInput}
                    placeholder={customInputPlaceholder ?? '학과명을 입력하세요'}
                    placeholderTextColor={Colors.textGray}
                    value={customValue}
                    onChangeText={setCustomValue}
                    returnKeyType="done"
                    onSubmitEditing={confirmCustom}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.confirmBtn, !customValue.trim() && styles.confirmBtnDisabled]}
                  onPress={confirmCustom}
                  disabled={!customValue.trim()}
                >
                  <Text style={[styles.confirmBtnText, !customValue.trim() && styles.confirmBtnTextDisabled]}>
                    입력 완료
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── 검색 모드 ── */
              <>
                <View style={styles.inputWrap}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textGray}
                    value={keyword}
                    onChangeText={setKeyword}
                    autoFocus
                  />
                </View>

                <FlatList
                  data={filtered}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.listItem} onPress={() => handleSelect(item)}>
                      <Text style={styles.listItemText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>검색 결과가 없어요</Text>
                  }
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 16 }}
                />

                {allowCustomInput && (
                  <TouchableOpacity style={styles.customInputBtn} onPress={enterCustomMode}>
                    <Text style={styles.customInputText}>✏  직접 입력하기</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '75%',
    backgroundColor: Colors.backgroundWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backBtn: {
    width: 32,
  },
  backBtnText: {
    fontSize: 28,
    color: Colors.textDark,
    lineHeight: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textDark,
  },
  closeBtn: {
    fontSize: 14,
    color: Colors.textGray,
  },

  // 검색 모드
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textDark,
  },
  listItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  listItemText: {
    fontSize: 15,
    color: Colors.textDark,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textGray,
    marginTop: 32,
    fontSize: 14,
  },
  customInputBtn: {
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  customInputText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },

  // 직접 입력 모드
  customModeWrap: {
    flex: 1,
    paddingTop: 8,
  },
  customModeDesc: {
    fontSize: 13,
    color: Colors.textGray,
    marginBottom: 20,
  },
  customInputWrap: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: Colors.backgroundWhite,
  },
  customInput: {
    fontSize: 16,
    color: Colors.textDark,
  },
  confirmBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.backgroundWhite,
  },
  confirmBtnTextDisabled: {
    color: '#AAAAAA',
  },
});
