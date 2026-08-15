-- ================================================================
-- Migration: 가입 시 필수/선택 동의 이력 저장
--
-- 배경: 베타 서비스 운영을 위해 회원가입 시점에 개인정보 수집·이용
-- 필수 동의와 서비스 이용기록(GA4/GTM/Clarity) 선택 동의를 받아야 한다.
-- 항목별 상세 이력 대신 동의 시각 + 약관버전만 최소한으로 기록한다.
-- ================================================================

ALTER TABLE users
  ADD COLUMN terms_agreed_at DATETIME NULL,
  ADD COLUMN terms_version VARCHAR(20) NULL,
  ADD COLUMN analytics_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
