import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../src/constants/colors';
import { TeamitLogo } from '../../src/components/common/TeamitLogo';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { tokenStorage } from '../../src/services/tokenStorage';

const { height: SCREEN_H } = Dimensions.get('window');
const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';
const SERVER_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.teamit.app/api/v1')
  .replace('/api/v1', '');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setUserId = useOnboardingStore((s) => s.setUserId);

  const handleKakaoLogin = async () => {
    if (IS_MOCK) {
      setUserId(1);
      router.replace('/(auth)/onboarding/basic-info');
      return;
    }

    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // 브라우저 열기 (await 안 함 — 폴링과 병행)
    WebBrowser.openBrowserAsync(`${SERVER_BASE}/api/v1/auth/kakao/web?sessionId=${sessionId}`);

    // 카카오 인증 최소 소요 시간 확보
    await new Promise((r) => setTimeout(r, 2000));

    // JWT 폴링 (1.5초 간격, 최대 90초)
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const res = await fetch(`${SERVER_BASE}/api/v1/auth/kakao/session/${sessionId}`);
        if (!res.ok) continue;
        const json = await res.json();
        if (!json.success || !json.data) continue;

        const { accessToken, refreshToken, userId, isNewUser } = json.data;
        await tokenStorage.setTokens(accessToken, refreshToken);
        setUserId(userId);
        WebBrowser.dismissBrowser();

        if (isNewUser) {
          router.replace('/(auth)/onboarding/basic-info');
        } else {
          router.replace('/(tabs)/home');
        }
        return;
      } catch {
        // 아직 로그인 미완료 — 계속 폴링
      }
    }

    Alert.alert('로그인 실패', '시간이 초과되었습니다. 다시 시도해주세요');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 로고 영역 */}
      <View style={styles.logoArea}>
        <View style={styles.logoGroup}>
          <View style={styles.logoClip}>
            <TeamitLogo
              width={SCREEN_H * 0.38}
              height={SCREEN_H * 0.38}
            />
          </View>
          <Text style={styles.tagline}>나에게 딱 맞는 팀</Text>
        </View>
      </View>

      {/* 버튼 영역 */}
      <View style={[
        styles.buttonArea,
        { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) },
      ]}>
        <TouchableOpacity
          style={styles.kakaoButton}
          onPress={handleKakaoLogin}
          activeOpacity={0.85}
        >
          <Text style={styles.kakaoIcon}>💬</Text>
          <Text style={styles.kakaoText}>카카오 계정으로 로그인</Text>
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
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: SCREEN_H * 0.18,
  },
  logoGroup: {
    alignItems: 'center',
  },
  logoClip: {
    width: SCREEN_H * 0.38,
    height: SCREEN_H * 0.27,
    overflow: 'hidden',
    alignItems: 'center',
  },
  tagline: {
    fontSize: 15,
    color: Colors.primary,
    marginTop: 10,
    fontWeight: '400',
  },
  buttonArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 16,
    alignItems: 'center',
  },
  kakaoButton: {
    width: '100%',
    height: 54,
    backgroundColor: '#FEE500',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  kakaoIcon: {
    fontSize: 20,
  },
  kakaoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3A1D1D',
  },
});
