import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { AgreementSection, TERMS_VERSION } from '../../src/components/common/AgreementSection';
import { submitTermsReconsent } from '../../src/services/mypageService';
import { logout as logoutApi } from '../../src/services/authService';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Alert } from '../../src/utils/alert';
import { trackEvent, setAnalyticsConsent } from '../../src/services/gtm';

// 약관이 개정돼서 기존 가입자가 다시 동의해야 하는 화면. needsTermsReconsent인 동안
// (tabs)/_layout.tsx가 여기로 계속 돌려보내는 소프트락 구조라, 뒤로가기로 못 빠져나가게
// 헤더에 back 버튼을 두지 않는다 — 나가는 유일한 방법은 동의하거나 로그아웃하는 것.
export default function ReconsentScreen() {
  const insets = useSafeAreaInsets();
  const [requiredAgreed, setRequiredAgreed] = useState(false);
  const [analyticsAgreed, setAnalyticsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!requiredAgreed || loading) return;
    setLoading(true);
    try {
      await submitTermsReconsent({ termsVersion: TERMS_VERSION, analyticsOptIn: analyticsAgreed });
      useAuthStore.getState().setNeedsTermsReconsent(false);
      setAnalyticsConsent(analyticsAgreed);
      trackEvent('terms_reconsent');
      router.replace('/(tabs)/home');
    } catch (e) {
      Alert.alert('오류', e instanceof Error ? e.message : '저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '동의하지 않고 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: async () => {
          try {
            await logoutApi();
          } finally {
            useAuthStore.getState().logout();
            router.replace('/(tabs)/home');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>약관 동의 안내</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>이용약관이 개정되었어요</Text>
        <Text style={styles.subtitle}>서비스를 계속 이용하시려면 아래 내용에 다시 동의해 주세요</Text>

        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ 필수 항목에 동의하지 않으면 서비스 이용이 제한돼요. 언제든 다시 돌아와 동의하시면
            바로 정상적으로 이용하실 수 있어요.
          </Text>
        </View>

        <AgreementSection
          requiredAgreed={requiredAgreed}
          analyticsAgreed={analyticsAgreed}
          onChangeRequired={setRequiredAgreed}
          onChangeAnalytics={setAnalyticsAgreed}
        />

        <TouchableOpacity style={styles.logoutLink} onPress={handleLogout}>
          <Text style={styles.logoutLinkText}>동의하지 않고 로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[
        styles.bottomArea,
        { paddingBottom: insets.bottom || 16 },
      ]}>
        <TouchableOpacity
          style={[styles.nextBtn, !requiredAgreed && styles.nextBtnDisabled]}
          onPress={handleSubmit}
          disabled={!requiredAgreed || loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextText, !requiredAgreed && styles.nextTextDisabled]}>동의하고 계속하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 6,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 16,
    lineHeight: 19,
  },
  warningBanner: {
    backgroundColor: Colors.ogTint,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12.5,
    color: Colors.primary,
    lineHeight: 18,
    fontWeight: '500',
  },
  logoutLink: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoutLinkText: {
    fontSize: 13,
    color: Colors.grayMedium,
    textDecorationLine: 'underline',
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  nextBtn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: Colors.lightGray,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  nextTextDisabled: {
    color: Colors.gray,
  },
});
