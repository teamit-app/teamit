-- ================================================================
-- Migration: 공모전 상세내용 + 이미지 필드 추가 (관리자 공모전 등록/수정 지원)
--
-- 변경 내용:
--   1. contests.content   — 공모전 상세내용 본문(줄바꿈 포함 자유 텍스트)
--   2. contests.image_url — 공모전 포스터 이미지 URL (실제 업로드 대신 외부 URL 저장)
-- ================================================================

ALTER TABLE contests
  ADD COLUMN content TEXT NULL COMMENT '공모전 상세내용 본문',
  ADD COLUMN image_url VARCHAR(500) NULL COMMENT '공모전 포스터 이미지 URL';
