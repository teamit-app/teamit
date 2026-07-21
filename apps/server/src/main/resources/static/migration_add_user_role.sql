-- ================================================================
-- Migration: 관리자 권한을 하드코딩된 user-id 대신 users.role로 관리
--
-- 배경: admin.user-id(환경변수) 하나만 비교하던 방식이라, 새 운영진에게
-- 권한을 주려면 코드를 고치고 재배포해야 했다. users.role 컬럼을 추가해서
-- 이후에는 UPDATE 한 줄로 권한을 부여/회수할 수 있게 한다.
-- ================================================================

ALTER TABLE users
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- 기존에 ADMIN_USER_ID=2로 운영하던 계정의 권한을 유지
UPDATE users SET role = 'ADMIN' WHERE id = 2;

-- 새 운영진에게 권한을 줄 때:
-- UPDATE users SET role = 'ADMIN' WHERE id = <해당 유저 id>;
