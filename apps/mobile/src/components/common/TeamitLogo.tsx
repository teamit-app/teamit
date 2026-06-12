import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface TeamitLogoProps {
  /** 너비 (px). height 미지정 시 정사각형 컨테이너로 contain-fit */
  width?: number;
  /** 높이 (px). width 미지정 시 정사각형 컨테이너로 contain-fit */
  height?: number;
  /** width/height 동시 지정 (정사각형) */
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * Teamit 공식 로고 이미지.
 * resizeMode="contain" 으로 비율을 절대 변형하지 않습니다.
 */
export function TeamitLogo({ size, width, height, style }: TeamitLogoProps) {
  const w = width ?? size ?? 120;
  const h = height ?? size ?? 120;

  return (
    <Image
      source={require('../../../assets/teamit_logo.png')}
      style={[{ width: w, height: h }, style]}
      resizeMode="contain"
    />
  );
}
