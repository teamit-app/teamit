import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';

export default function LoginScreen() {
  const handleKakaoLogin = () => {
    // TODO: 카카오 로그인 연동
    router.replace('/(auth)/onboarding/basic-info');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>팀잇</Text>
      <Text style={styles.subtitle}>공모전·프로젝트 팀원 매칭</Text>
      <TouchableOpacity style={styles.kakaoButton} onPress={handleKakaoLogin}>
        <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundWhite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textGray,
    marginBottom: 60,
  },
  kakaoButton: {
    width: '100%',
    backgroundColor: '#FEE500',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A1D1D',
  },
});
