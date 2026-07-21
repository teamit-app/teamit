-- ================================================================
-- Migration: 닉네임 중복 방지를 위한 UNIQUE 제약 추가
--
-- 배경: 애플리케이션 레벨(UserService.ensureNicknameAvailable)에서 중복 검사를
-- 추가했지만, 동시 요청 레이스 컨디션까지 막으려면 DB 제약이 필요하다.
--
-- 주의: 실행 전에 기존 중복 닉네임이 있는지 먼저 확인할 것. 중복이 있으면
-- ALTER TABLE이 에러로 실패한다. 아래 쿼리로 먼저 확인:
--   SELECT nickname, COUNT(*) FROM users WHERE nickname IS NOT NULL
--   GROUP BY nickname HAVING COUNT(*) > 1;
-- 중복이 있다면 하나만 남기고 나머지 닉네임을 수동으로 바꾼 뒤 실행한다.
-- ================================================================

ALTER TABLE users
  ADD UNIQUE INDEX uk_users_nickname (nickname);
