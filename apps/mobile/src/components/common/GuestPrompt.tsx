import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { withAuth } from '../../utils/authGuard';

interface GuestPromptProps {
  title?: string;
  subtitle?: string;
  // 로그인 완료 후 돌아올 경로 — 지금 이 탭 자신의 경로를 넘기면 된다
  returnPath: string;
}

// 로그인 없이 들어온 "메시지"/"내정보" 탭에서 실제 내용 대신 보여주는 안내 화면
export function GuestPrompt({
  title = '로그인하고 매칭을 시작해보세요',
  subtitle = '팀 제안을 받고, 메시지를 주고받으려면 로그인이 필요해요',
  returnPath,
}: GuestPromptProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => withAuth(returnPath)}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>로그인하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.grayMedium,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
