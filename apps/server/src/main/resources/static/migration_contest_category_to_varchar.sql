-- ================================================================
-- Migration: contests.category를 네이티브 ENUM에서 VARCHAR(20)로 변경
--
-- 배경: Hibernate가 @Enumerated(EnumType.STRING)을 MySQL에서 네이티브
-- ENUM(...) 컬럼으로 만들어서, 새 카테고리(MARKETING)를 추가했을 때
-- 목록에 없는 값이라 INSERT/UPDATE가 "Data truncated for column
-- 'category'"로 실패했다. VARCHAR로 바꾸면 이후 카테고리 추가는
-- ContestCategory.java에만 값을 더하면 되고 DB 마이그레이션이 필요 없다.
--
-- 기존 ENUM 값들의 문자열 표현이 그대로 유지되므로 기존 데이터는 안전하다.
-- ================================================================

ALTER TABLE contests MODIFY COLUMN category VARCHAR(20) NOT NULL;
