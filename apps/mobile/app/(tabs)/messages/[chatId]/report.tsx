import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';

const reasons = [
  '욕설 및 비방',
  '스팸 및 도배',
  '개인정보 침해',
  '사기 및 허위 정보',
  '기타',
];

const MAX_LENGTH = 200;

export default function ReportScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>신고하기</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeIcon}>📋</Text>
            <Text style={styles.noticeText}>
              {'허위 신고 시 서비스 이용이 제한될 수 있습니다.\n접수된 신고는 24시간 이내에 검토됩니다.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              신고 사유를 선택해주세요 <Text style={styles.required}>*</Text>
            </Text>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={styles.reasonRow}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.7}
              >
                <View style={[styles.radio, selectedReason === reason && styles.radioSelected]}>
                  {selectedReason === reason && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기타 사유 (선택)</Text>
            <View style={styles.textInputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="신고 내용을 자세히 입력해 주세요. (최대 200자)"
                placeholderTextColor={Colors.grayMedium}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, MAX_LENGTH))}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length} / {MAX_LENGTH}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedReason}
          >
            <Text style={styles.submitButtonText}>신고 접수하기</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.ogTint,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  noticeIcon: {
    fontSize: 18,
    alignSelf: 'center',
    includeFontPadding: false,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 19,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 14,
  },
  required: {
    color: Colors.primary,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  reasonText: {
    fontSize: 15,
    color: Colors.dark,
  },
  textInputWrapper: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    marginBottom: 12,
    paddingBottom: 8,
  },
  textInput: {
    minHeight: 120,
    padding: 14,
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 12,
    color: Colors.grayMedium,
    textAlign: 'right',
    paddingHorizontal: 14,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
