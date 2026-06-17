export const Colors = {
  // ── 브랜드 컬러 시스템 ──────────────────────────────────────
  primary:   '#FF6B1C',   // Primary
  dark:      '#212121',   // Dark
  gray:      '#757575',   // Gray
  grayMedium:'#9E9E9E',   // Text (3단계)
  grayLight: '#B8B8B8',   // Text (4단계)
  lightGray: '#E0E0E0',   // Light Gray / Border
  ogTint:    '#FFF2EB',   // OG Tint (브랜드 라이트 배경 · Sub)
  white:     '#FFFFFF',   // White
  pageBg:    '#F7F7F7',   // Background (라이트 그레이)

  // ── 시맨틱 alias (기존 코드 호환) ───────────────────────────
  textDark:        '#212121',
  textGray:        '#757575',
  backgroundLight: '#FFF2EB',
  backgroundWhite: '#FFFFFF',
  border:          '#E0E0E0',
  error:           '#D32F2F',
} as const;
