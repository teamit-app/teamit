import React, { useState, useMemo } from 'react';
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
}

export function SearchBottomSheet({
  visible,
  title,
  placeholder,
  items,
  onSelect,
  onClose,
  allowCustomInput = false,
}: SearchBottomSheetProps) {
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(
    () => items.filter((s) => s.includes(keyword)),
    [items, keyword],
  );

  const handleSelect = (item: string) => {
    setKeyword('');
    onSelect(item);
  };

  const handleCustomInput = () => {
    if (keyword.trim()) {
      handleSelect(keyword.trim());
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
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={() => { setKeyword(''); onClose(); }}>
                <Text style={styles.closeBtn}>닫기</Text>
              </TouchableOpacity>
            </View>

            {/* search input */}
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

            {/* list */}
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

            {/* 직접 입력 */}
            {allowCustomInput && (
              <TouchableOpacity style={styles.customInputBtn} onPress={handleCustomInput}>
                <Text style={styles.customInputText}>✏ 직접 입력하기</Text>
              </TouchableOpacity>
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
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textDark,
  },
  closeBtn: {
    fontSize: 14,
    color: Colors.textGray,
  },
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
    marginHorizontal: 0,
    marginBottom: 12,
  },
  customInputText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
