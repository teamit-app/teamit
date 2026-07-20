import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../src/constants/colors';
import { Alert } from '../../src/utils/alert';
import { TeamitLogo } from '../../src/components/common/TeamitLogo';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { tokenStorage } from '../../src/services/tokenStorage';
import { devLogin } from '../../src/services/authService';

const { height: SCREEN_H } = Dimensions.get('window');
const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';
const SERVER_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.teamit.app/api/v1')
  .replace('/api/v1', '');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setUserId = useOnboardingStore((s) => s.setUserId);
  // 로그인이 필요한 액션(후보등록·모집글작성·지원하기 등)에서 여기로 넘어온 경우, 로그인
  // (+ 필요하면 온보딩) 완료 후 원래 가려던 화면으로 돌아가기 위한 복귀 경로 (authGuard.ts 참고)
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const onboardingHref = `/(auth)/onboarding/basic-info${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
  const resumeHref = returnTo ? decodeURIComponent(returnTo) : '/(tabs)/home';

  // 개발자 로그인 모달 상태 (__DEV__ 전용)
  const [isDevModalVisible, setIsDevModalVisible] = useState(false);
  const [devNickname, setDevNickname] = useState('');

  // 로그인 진행 중 상태 — 연타 방지 + 카카오 폴링 취소용
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const cancelKakaoPollRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelKakaoPollRef.current = true;
    };
  }, []);

  const handleKakaoLogin = async () => {
    if (isLoggingIn) return;

    if (IS_MOCK) {
      setUserId(1);
      router.replace(onboardingHref as never);
      return;
    }

    setIsLoggingIn(true);
    cancelKakaoPollRef.current = false;

    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // 브라우저 열기 (await 안 함 — 폴링과 병행)
    WebBrowser.openBrowserAsync(`${SERVER_BASE}/api/v1/auth/kakao/web?sessionId=${sessionId}`);

    // 카카오 인증 최소 소요 시간 확보
    await new Promise((r) => setTimeout(r, 2000));

    // JWT 폴링 (1.5초 간격, 최대 90초) — 개발자 로그인으로 먼저 로그인하거나
    // 화면을 벗어나면 cancelKakaoPollRef가 true가 되어 즉시 중단됨
    for (let i = 0; i < 60; i++) {
      if (cancelKakaoPollRef.current) return;
      await new Promise((r) => setTimeout(r, 1500));
      if (cancelKakaoPollRef.current) return;
      try {
        const res = await fetch(`${SERVER_BASE}/api/v1/auth/kakao/session/${sessionId}`);
        if (!res.ok) continue;
        const json = await res.json();
        if (!json.success || !json.data) continue;

        const { accessToken, refreshToken, userId, isNewUser } = json.data;
        await tokenStorage.setTokens(accessToken, refreshToken);
        setUserId(userId);
        // 탭 레이아웃의 fetchCurrentUserId()가 마운트 후에야 돌기 때문에, 그 전에
        // currentUserId를 읽는 화면(탐색 등)이 먼저 실행되면 아직 null인 상태를
        // "비로그인"으로 오판해 데이터를 잘못 캐싱하는 레이스 컨디션이 생긴다.
        // 여기서 이미 확보한 userId를 바로 반영해 그 창을 없앤다.
        useAuthStore.getState().setCurrentUserId(userId);
        WebBrowser.dismissBrowser();

        if (isNewUser) {
          router.replace(onboardingHref as never);
        } else {
          router.replace(resumeHref as never);
        }
        return;
      } catch {
        // 아직 로그인 미완료 — 계속 폴링
      }
    }

    setIsLoggingIn(false);
    Alert.alert('로그인 실패', '시간이 초과되었습니다. 다시 시도해주세요');
  };

  const handleDevLogin = async () => {
    if (isLoggingIn) return;
    const nickname = devNickname.trim();
    if (!nickname) return;

    // 혹시 카카오 로그인 폴링이 백그라운드에서 돌고 있었다면 즉시 중단
    cancelKakaoPollRef.current = true;
    setIsLoggingIn(true);
    try {
      const response = await devLogin(nickname);
      setUserId(response.userId);
      useAuthStore.getState().setCurrentUserId(response.userId);
      setIsDevModalVisible(false);
      setDevNickname('');

      // isNewUser만으로는 온보딩 완료 여부를 판단할 수 없음 (재로그인 시 false)
      // index.tsx와 동일하게 /users/me의 needsOnboarding으로 판단
      const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.teamit.app/api/v1';
      const meRes = await fetch(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${response.accessToken}` },
      });
      const meJson = await meRes.json();
      if (meJson.data?.needsOnboarding) {
        router.replace(onboardingHref as never);
      } else {
        router.replace(resumeHref as never);
      }
    } catch (e) {
      setIsLoggingIn(false);
      Alert.alert('개발자 로그인 실패', String(e));
    }
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
          style={[styles.kakaoButton, isLoggingIn && styles.kakaoButtonDisabled]}
          onPress={handleKakaoLogin}
          activeOpacity={0.85}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#3A1D1D" />
          ) : (
            <>
              <Text style={styles.kakaoIcon}>💬</Text>
              <Text style={styles.kakaoText}>카카오 계정으로 로그인</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 개발자 로그인 버튼 — __DEV__ 빌드(Expo Go)에서만 표시 */}
        {__DEV__ && !IS_MOCK && (
          <TouchableOpacity
            style={styles.devButton}
            onPress={() => setIsDevModalVisible(true)}
            activeOpacity={0.7}
            disabled={isLoggingIn}
          >
            <Text style={styles.devButtonText}>🛠 개발자 로그인</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 개발자 로그인 모달 */}
      {__DEV__ && (
        <Modal visible={isDevModalVisible} animationType="fade" transparent>
          <View style={devModal.overlay}>
            <View style={devModal.box}>
              <Text style={devModal.title}>🛠 개발자 로그인</Text>
              <Text style={devModal.desc}>
                닉네임을 입력하면 해당 유저를 찾거나 새로 생성하여 로그인합니다.
              </Text>
              <TextInput
                style={devModal.input}
                placeholder="닉네임 (예: 유저A)"
                placeholderTextColor={Colors.grayLight}
                value={devNickname}
                onChangeText={setDevNickname}
                autoFocus
              />
              <View style={devModal.buttons}>
                <TouchableOpacity
                  style={devModal.cancelBtn}
                  onPress={() => { setIsDevModalVisible(false); setDevNickname(''); }}
                  disabled={isLoggingIn}
                >
                  <Text style={devModal.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[devModal.confirmBtn, isLoggingIn && devModal.confirmBtnDisabled]}
                  onPress={handleDevLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={devModal.confirmText}>로그인</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  kakaoButtonDisabled: {
    opacity: 0.6,
  },
  kakaoIcon: {
    fontSize: 20,
  },
  kakaoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3A1D1D',
  },
  devButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  devButtonText: {
    fontSize: 13,
    color: Colors.grayMedium,
    textDecorationLine: 'underline',
  },
});

const devModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  box: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    color: Colors.grayMedium,
    lineHeight: 20,
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.pageBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.dark,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.grayMedium,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
