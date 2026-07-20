-- ================================================================
-- Migration: "완료된 프로젝트" 기능 제거에 따른 되돌리기
--
-- 배경: 완료된 프로젝트 기능 자체를 없애기로 했다. 모집글 소프트 삭제(posts.deleted_at)와
-- 리뷰의 postId 기반 스코프(team_reviews.post_id)는 더 이상 필요 없다. 다만 "채팅방을
-- 삭제해도 리뷰는 지우지 않는다"는 원칙은 유지되므로 team_reviews.chat_room_id는
-- 계속 nullable로 둔다(detach 로직이 필요로 함).
--
-- 변경 내용:
--   1. team_reviews.post_id 컬럼 삭제
--   2. team_reviews 유니크 제약을 (chat_room_id, reviewer_id, receiver_id)로 복귀
--   3. posts.deleted_at 컬럼 삭제
-- ================================================================

-- 주의: post_id의 유니크 제약/FK 이름은 환경마다 다를 수 있다(수동으로 지정한 이름이거나,
-- Hibernate ddl-auto=update가 자동 생성한 이름일 수 있음). 아래 SHOW 문으로 먼저 실제 이름을
-- 확인한 뒤 DROP 문의 이름을 맞춰서 실행할 것.
--   SHOW INDEX FROM team_reviews;
--   SHOW CREATE TABLE team_reviews;

-- post_id를 참조하는 FK가 있다면 먼저 제거 (없으면 이 줄은 생략)
-- ALTER TABLE team_reviews DROP FOREIGN KEY <실제_FK_이름>;

ALTER TABLE team_reviews
  DROP INDEX <실제_유니크_제약_이름>;

ALTER TABLE team_reviews
  DROP COLUMN post_id;

ALTER TABLE team_reviews
  ADD CONSTRAINT uk_team_reviews_chatroom_reviewer_receiver UNIQUE (chat_room_id, reviewer_id, receiver_id);

ALTER TABLE posts
  DROP COLUMN deleted_at;
