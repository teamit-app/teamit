-- ================================================================
-- Migration: 모집글 생성 시 팀 채팅방 자동 생성 연동
-- Issue: #45 feature/post-chat-be
--
-- 변경 내용:
--   1. chat_rooms.contest_id  — 채팅방이 파생된 공모전 ID
--   2. posts.chat_room_id     — 모집글과 연결된 팀 채팅방 ID
-- ================================================================

-- 1. chat_rooms 테이블에 contest_id 컬럼 추가
ALTER TABLE chat_rooms
  ADD COLUMN contest_id BIGINT NULL COMMENT '채팅방이 파생된 공모전 ID (GROUP 타입만 사용, DIRECT는 NULL)';

-- 2. posts 테이블에 chat_room_id 컬럼 추가
ALTER TABLE posts
  ADD COLUMN chat_room_id BIGINT NULL COMMENT '이 모집글의 팀 채팅방 ID';
