-- ================================================================
-- Migration: contests.link_url / image_url을 varchar(255) → TEXT로 확장
--
-- 배경: link_url이 기본 varchar(255)로 생성돼 있어서, 마케팅 사이트의
-- 트래킹 파라미터가 붙은 긴 접수 URL을 저장할 때 "Data too long for
-- column 'link_url'" 에러로 공모전 등록이 실패했다. image_url도 같은
-- 이유(외부 URL 직접 입력을 계속 지원)로 함께 넓힌다.
-- ================================================================

ALTER TABLE contests MODIFY COLUMN link_url TEXT;
ALTER TABLE contests MODIFY COLUMN image_url TEXT;
