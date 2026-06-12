import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { TeamitLogo } from '../../src/components/common/TeamitLogo';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';

const { height: SCREEN_H } = Dimensions.get('window');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setUserId = useOnboardingStore((s) => s.setUserId);

  const handleKakaoLogin = () => {
    setUserId(1);
    router.replace('/(auth)/onboarding/basic-info');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 로고 영역 */}
      <View style={styles.logoArea}>
        <View style={styles.logoGroup}>
          {/* 하단 투명 여백을 잘라내기 위해 overflow:hidden 래퍼 사용 */}
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
