import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { resolveImageUrl } from '../../utils/imageUrl';

interface UserAvatarProps {
  uri?: string | null;
  fallback: string; // 사진이 없을 때 보여줄 이모지
  style?: StyleProp<ViewStyle>; // 원형 크기·배경·테두리는 각 화면 스타일을 그대로 쓴다
  textStyle?: StyleProp<TextStyle>;
}

// 유저 프로필 사진 공통 컴포넌트 — 사진이 있으면 원 안을 꽉 채워 보여주고, 없으면 기존 이모지로 대체한다
export function UserAvatar({ uri, fallback, style, textStyle }: UserAvatarProps) {
  const imageUrl = resolveImageUrl(uri);
  return (
    <View style={[style, styles.clip]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} />
      ) : (
        <Text style={textStyle}>{fallback}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
