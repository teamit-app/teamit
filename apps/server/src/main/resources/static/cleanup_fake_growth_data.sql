-- ============================================================
-- seed_fake_growth_data.sql로 넣은 가짜 데이터 전체 삭제 스크립트
--
-- 용도: 시드 스크립트를 다시 실행하기 전에 이전 실행분을 깨끗이 지우기 위함.
--       FK 참조 순서(UserService.withdraw()의 회원탈퇴 로직과 동일한 순서)를
--       그대로 따라서 자식 레코드부터 지운다.
--
-- 대상 식별: kakao_id BETWEEN 991001 AND 991050 (가짜 유저 50명)
--           + 그 유저들이 작성한 모집글(및 그 모집글의 자식 레코드)
--           + 그 유저들이 다른(실제) 모집글에 남긴 좋아요/댓글/지원
--
-- 주의: chat_room_members/chat_rooms는 건드리지 않는다 — 이 시드는 채팅방을 만들지
--      않으므로(모든 가짜 모집글의 chat_room_id가 NULL) 정리 대상이 없다. 만약 로컬에서
--      가짜 유저와 실제로 채팅을 열어봤다면 그 채팅방/멤버는 이 스크립트로 안 지워진다.
-- ============================================================

USE teamit;

SET NAMES utf8mb4;

START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS tmp_cleanup_user_ids;
CREATE TEMPORARY TABLE tmp_cleanup_user_ids AS
SELECT id FROM users WHERE kakao_id BETWEEN 991001 AND 991050;

DROP TEMPORARY TABLE IF EXISTS tmp_cleanup_post_ids;
CREATE TEMPORARY TABLE tmp_cleanup_post_ids AS
SELECT id AS post_id FROM posts
WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);

-- ──────────────────────────────────────────────────────────────
-- 1. 대댓글 자기참조(parent_id) 먼저 끊기 — 지워질 댓글이 다른 댓글의 부모인 경우
--    자기참조 FK 때문에 곧바로 삭제하면 실패한다(UserService.withdraw()와 동일한 이유).
--    "자기 자신을 서브쿼리로 다시 조회" 하는 걸 MySQL이 금지해서(에러 1093),
--    한 번 더 감싸서 파생 테이블로 만든다.
-- ──────────────────────────────────────────────────────────────
UPDATE post_comments SET parent_id = NULL
WHERE parent_id IN (
  SELECT id FROM (
    SELECT id FROM post_comments
    WHERE post_id IN (SELECT post_id FROM tmp_cleanup_post_ids)
       OR author_id IN (SELECT id FROM tmp_cleanup_user_ids)
  ) AS x
);

-- ──────────────────────────────────────────────────────────────
-- 2. 가짜 유저가 작성한 모집글 + 그 모집글에 달린 자식 레코드
--    (다른 사람이 그 모집글에 남긴 지원/좋아요/댓글/초대까지 전부 포함)
-- ──────────────────────────────────────────────────────────────
DELETE FROM team_invitations WHERE post_id IN (SELECT post_id FROM tmp_cleanup_post_ids);
DELETE FROM post_applications WHERE post_id IN (SELECT post_id FROM tmp_cleanup_post_ids);
DELETE FROM post_hearts WHERE post_id IN (SELECT post_id FROM tmp_cleanup_post_ids);
DELETE FROM post_comments WHERE post_id IN (SELECT post_id FROM tmp_cleanup_post_ids);
DELETE FROM post_skills WHERE post_id IN (SELECT post_id FROM tmp_cleanup_post_ids);
DELETE FROM posts WHERE id IN (SELECT post_id FROM tmp_cleanup_post_ids);

-- ──────────────────────────────────────────────────────────────
-- 3. 가짜 유저가 "다른(실제) 모집글"에 남긴 지원/좋아요/댓글/초대
--    (위 2번은 가짜 유저가 소유한 글 기준이었고, 이건 반대로 가짜 유저가 행위자인 경우)
-- ──────────────────────────────────────────────────────────────
-- OR로 한 문장에 합치면 tmp_cleanup_user_ids를 두 번 참조하게 되어 또 "Can't reopen table"이
-- 나므로, 여기서도 문장을 나눈다.
DELETE FROM team_invitations WHERE sender_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM team_invitations WHERE receiver_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM post_applications WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM post_hearts WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM post_comments WHERE author_id IN (SELECT id FROM tmp_cleanup_user_ids);

-- ──────────────────────────────────────────────────────────────
-- 4. 공모전 관련 (이 시드는 만들지 않지만, 혹시 로컬에서 후보 등록/하트를 눌러봤을 수 있어 방어적으로 포함)
-- ──────────────────────────────────────────────────────────────
DELETE FROM contest_hearts WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM contest_participants WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);

-- ──────────────────────────────────────────────────────────────
-- 5. 관심 팀원(하트)·알림 — 가짜 유저가 하트를 누른 쪽/받은 쪽 둘 다 정리
-- ──────────────────────────────────────────────────────────────
DELETE FROM user_hearts WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM user_hearts WHERE target_user_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM notifications WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);

-- ──────────────────────────────────────────────────────────────
-- 6. 프로필 상세 정보(1:N)
-- ──────────────────────────────────────────────────────────────
DELETE FROM careers WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM education WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM user_skills WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM user_region WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);

-- ──────────────────────────────────────────────────────────────
-- 7. PK가 곧 user_id인 1:1 테이블
-- ──────────────────────────────────────────────────────────────
DELETE FROM matching_profile WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);
DELETE FROM notification_settings WHERE user_id IN (SELECT id FROM tmp_cleanup_user_ids);

-- ──────────────────────────────────────────────────────────────
-- 8. 마지막으로 유저 본체 삭제
-- ──────────────────────────────────────────────────────────────
DELETE FROM users WHERE id IN (SELECT id FROM tmp_cleanup_user_ids);

DROP TEMPORARY TABLE IF EXISTS tmp_cleanup_user_ids;
DROP TEMPORARY TABLE IF EXISTS tmp_cleanup_post_ids;

COMMIT;

-- 확인
SELECT COUNT(*) AS remaining_fake_users FROM users WHERE kakao_id BETWEEN 991001 AND 991050;
