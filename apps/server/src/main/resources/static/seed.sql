-- ============================================================
-- 티밋 테스트용 시드 데이터 (이슈 2: 모집글 API)
-- 실행 전: 서버를 한 번 재시작해서 posts 테이블 컬럼 업데이트 먼저 적용할 것
-- 실행 방법: MySQL Workbench 또는 커맨드라인에서 직접 실행
-- ============================================================

USE teamit;

-- ──────────────────────────────────────────────────────────────
-- 1. 공모전 데이터 (없으면 삽입)
-- ──────────────────────────────────────────────────────────────
INSERT IGNORE INTO contests (id, title, organizer, category, target, recruit_field, prize, start_date, end_date, link_url, created_at, updated_at) VALUES
(1, '2025 대학생 창업 아이디어 공모전', '창업진흥원', 'STARTUP',
 '대학생 / 대학원생', '창업 아이디어, IT, 사회혁신', '총 5,000만원 (대상 2,000만원)',
 '2025-06-01', '2025-08-15', 'https://example.com/contest1', NOW(), NOW()),

(2, '2025 스타트업 해커톤', '중소벤처기업부', 'IT',
 '대학생 / 일반인', 'IT, 개발, 스타트업', '총 3,000만원 (대상 1,000만원)',
 '2025-05-01', '2025-09-30', 'https://example.com/contest2', NOW(), NOW()),

(3, 'UX/UI 디자인 챌린지', '한국디자인진흥원', 'DESIGN',
 '대학생 / 디자인 전공자', '디자인, UX/UI', '총 2,000만원',
 '2025-06-10', '2025-09-10', 'https://example.com/contest3', NOW(), NOW()),

(4, 'AI 서비스 개발 해커톤', '과학기술정보통신부', 'IT',
 '대학생 / 일반인', 'AI, 머신러닝, 서비스 개발', '총 4,000만원',
 '2025-07-01', '2025-10-31', 'https://example.com/contest4', NOW(), NOW());

-- ──────────────────────────────────────────────────────────────
-- 2. 모집글 데이터
-- 주의: user_id는 실제 DB에 있는 유저 ID로 바꿔서 실행하세요
--       SELECT id FROM users LIMIT 5; 로 확인 가능
-- ──────────────────────────────────────────────────────────────

-- 아래 @MY_USER_ID 를 본인 user id로 교체 후 실행
SET @MY_USER_ID = (SELECT id FROM users ORDER BY id LIMIT 1);

INSERT INTO posts (title, description, contest_id, user_id, recruit_count, status, deadline, online_offline, gender_condition, school_condition, created_at, updated_at) VALUES
(
  '창업 공모전 팀원 구합니다 🔥 기획/개발 환영',
  '안녕하세요! 2025 대학생 창업 아이디어 공모전에 함께 참가할 팀원을 찾습니다.\n\n저는 백엔드 개발을 맡을 예정이고, 기획자 1명과 프론트엔드 개발자 1명을 더 찾고 있어요.\n\n주 2~3회 온라인 미팅 예정이고, 열정 있는 분이면 누구든 환영합니다!',
  1, @MY_USER_ID, 3, 'OPEN', '2025-08-01', 'MIXED', 'ANY', 'ANY',
  NOW(), NOW()
),
(
  'IT 해커톤 같이 나갈 팀원 구해요 (개발자 우대)',
  '스타트업 해커톤 팀원 모집합니다.\n\n현재 기획 1명 확정, 개발자 2명 추가 모집 중입니다.\n경험보다는 열정과 성실함을 중요하게 생각해요. 함께 완주할 수 있는 분!',
  2, @MY_USER_ID, 4, 'OPEN', '2025-09-15', 'ONLINE', 'ANY', 'ANY',
  NOW(), NOW()
),
(
  'UX/UI 디자인 챌린지 팀 구성 중 — 디자이너 필수!',
  '디자인 챌린지 함께 나갈 팀원을 구합니다.\n\n디자이너 1~2명 + 기획자 1명 모집 중이에요.\nFigma 사용 가능하신 분 우대, 포트폴리오 제출 시 우선 연락드립니다.',
  3, @MY_USER_ID, 3, 'OPEN', '2025-09-01', 'OFFLINE', 'ANY', 'SAME_SCHOOL',
  NOW(), NOW()
),
(
  'AI 해커톤 백엔드/ML 엔지니어 구합니다',
  'AI 서비스 개발 해커톤 팀원 모집입니다.\n\n현재 팀 구성: 기획 1명 + 프론트 1명\n추가 모집: 백엔드 1명, ML/AI 1명\n\nPython, PyTorch 또는 TensorFlow 경험자 우대.',
  4, @MY_USER_ID, 4, 'OPEN', '2025-10-15', 'MIXED', 'ANY', 'ANY',
  NOW(), NOW()
),
(
  '[마감] 지난 공모전 팀 모집 (마감된 예시)',
  '이미 마감된 모집글 테스트용 데이터입니다.',
  1, @MY_USER_ID, 2, 'CLOSED', '2025-06-01', 'ONLINE', 'ANY', 'ANY',
  DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)
);

-- ──────────────────────────────────────────────────────────────
-- 3. 데이터 확인 (모집글)
-- ──────────────────────────────────────────────────────────────
SELECT p.id, p.title, p.status, p.contest_id, c.title AS contest_title, p.recruit_count
FROM posts p
LEFT JOIN contests c ON p.contest_id = c.id
ORDER BY p.id DESC;

-- ============================================================
-- 테스트 후보자 데이터 — candidates 화면 검증용
-- 이 섹션을 실행하면 6명의 가상 후보가 contest_participants에 등록됩니다.
--
-- 실행 방법:
--   1. 아래 @CONTEST_ID 를 테스트할 공모전 ID로 변경 (기본 1)
--   2. MySQL Workbench에서 블록 선택 후 실행
-- ============================================================

-- 0. 후보를 등록할 공모전 ID
SET @CONTEST_ID = 1;

-- ──────────────────────────────────────────────────────────────
-- 4. 테스트 유저 6명 (kakao_id 99901~99906 = 테스트 전용)
-- ──────────────────────────────────────────────────────────────
INSERT INTO users (kakao_id, nickname, name, gender, birth_date, is_matching_active, created_at, updated_at)
VALUES
  (99901, '김티밋', '김민준', 'MALE',   '2000-03-15', TRUE, NOW(), NOW()),
  (99902, '끄적이', '박지수', 'FEMALE', '2001-07-22', TRUE, NOW(), NOW()),
  (99903, '멈물미', '이승환', 'MALE',   '1999-11-08', TRUE, NOW(), NOW()),
  (99904, '박혁신', '박현우', 'MALE',   '2000-05-30', TRUE, NOW(), NOW()),
  (99905, '이창의', '이수빈', 'FEMALE', '2001-02-14', TRUE, NOW(), NOW()),
  (99906, '최기획', '최도현', 'MALE',   '1999-09-03', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  nickname           = VALUES(nickname),
  name               = VALUES(name),
  is_matching_active = TRUE,
  updated_at         = NOW();

SET @U1 = (SELECT id FROM users WHERE kakao_id = 99901);
SET @U2 = (SELECT id FROM users WHERE kakao_id = 99902);
SET @U3 = (SELECT id FROM users WHERE kakao_id = 99903);
SET @U4 = (SELECT id FROM users WHERE kakao_id = 99904);
SET @U5 = (SELECT id FROM users WHERE kakao_id = 99905);
SET @U6 = (SELECT id FROM users WHERE kakao_id = 99906);

-- ──────────────────────────────────────────────────────────────
-- 5. 학력
-- ──────────────────────────────────────────────────────────────
DELETE FROM education WHERE user_id IN (@U1, @U2, @U3, @U4, @U5, @U6);
INSERT INTO education (user_id, school_name, status, major_type, major, verified, verification_status)
VALUES
  (@U1, '연세대학교',     'ATTENDING', 'SINGLE', '컴퓨터공학과',  FALSE, 'NONE'),
  (@U2, '홍익대학교',     'ATTENDING', 'SINGLE', '컴퓨터공학과',  TRUE,  'APPROVED'),
  (@U3, '충남대학교',     'ATTENDING', 'SINGLE', '화학과',        FALSE, 'NONE'),
  (@U4, '한양대학교',     'ATTENDING', 'SINGLE', '소프트웨어학부', FALSE, 'NONE'),
  (@U5, '이화여자대학교', 'ATTENDING', 'SINGLE', '디자인학부',    FALSE, 'NONE'),
  (@U6, '고려대학교',     'ATTENDING', 'SINGLE', '경영학과',      FALSE, 'NONE');

-- ──────────────────────────────────────────────────────────────
-- 6. 지역
-- ──────────────────────────────────────────────────────────────
DELETE FROM user_region WHERE user_id IN (@U1, @U2, @U3, @U4, @U5, @U6);
INSERT INTO user_region (user_id, sido, sigungu)
VALUES
  (@U1, '서울', '강남구'),
  (@U2, '서울', '마포구'),
  (@U3, '서울', '강남구'),
  (@U4, '부산', '해운대구'),
  (@U5, '서울', '종로구'),
  (@U6, '서울', '서초구');

-- ──────────────────────────────────────────────────────────────
-- 7. 스킬
-- ──────────────────────────────────────────────────────────────
DELETE FROM user_skills WHERE user_id IN (@U1, @U2, @U3, @U4, @U5, @U6);
INSERT INTO user_skills (user_id, skill_id, skill_name_custom)
VALUES
  (@U1, NULL, 'React'),   (@U1, NULL, 'TypeScript'), (@U1, NULL, 'Figma'),
  (@U2, NULL, 'React'),   (@U2, NULL, 'TypeScript'), (@U2, NULL, 'Figma'),
  (@U3, NULL, 'React'),   (@U3, NULL, 'TypeScript'),
  (@U4, NULL, 'Python'),  (@U4, NULL, 'Django'),     (@U4, NULL, 'React'),
  (@U5, NULL, 'Figma'),   (@U5, NULL, 'Photoshop'),  (@U5, NULL, 'Zeplin'),
  (@U6, NULL, 'Java'),    (@U6, NULL, 'Spring'),      (@U6, NULL, 'React');

-- ──────────────────────────────────────────────────────────────
-- 8. 매칭 프로필
--    experience_level: 0=처음 1=경험있어요 2=베테랑
--    intensity_level:  1=주1~3h 2=주4~7h 3=주8~14h 4=주15h+
--    team_vibe:        1(자유) ~ 5(성과중심)
--    feedback_style:   1(직접적) ~ 5(부드러운)
--    leadership_pref:  WANT / IF_NEEDED / DONT_WANT
--    online_offline:   ONLINE / OFFLINE / MIXED
-- ──────────────────────────────────────────────────────────────
INSERT INTO matching_profile
  (user_id, skills_csv, experience_level, intensity_level, online_offline_pref,
   team_vibe, feedback_style, leadership_pref, appeal_title, appeal_content)
VALUES
  (@U1, 'React,TypeScript,Figma',  2, 2, 'MIXED',   5, 4, 'IF_NEEDED',
   '열정 넘치는 개발자!',
   '안녕하세요! 백엔드 개발에 관심이 있는 김티밋입니다\n뽑아만 주신다면 열심히 참여하겠습니다🔥'),

  (@U2, 'React,TypeScript,Figma',  1, 1, 'MIXED',   3, 3, 'DONT_WANT',
   '트렌드에 민감한 디자이너!',
   '트렌드에 민감한 디자이너를 원하신다면 저를!\n디자인으로 팀의 완성도를 높여드릴게요.'),

  (@U3, 'React,TypeScript',        0, 2, 'MIXED',   4, 2, 'IF_NEEDED',
   '열심히 하겠습니다!',
   '잘 부탁드립니다! 열심히 하겠습니다!!\n첫 공모전이라 열정만큼은 누구에게도 지지 않아요.'),

  (@U4, 'Python,Django,React',     2, 3, 'ONLINE',  5, 3, 'WANT',
   'AI/ML 개발자',
   'Python 5년차, AI 프로젝트 경험이 있습니다. 성과 중심으로 협업해요.'),

  (@U5, 'Figma,Photoshop,Zeplin', 1, 2, 'OFFLINE', 3, 4, 'DONT_WANT',
   '감각 있는 UI 디자이너',
   '이화여대 디자인 전공, 공모전 2회 수상 경험 있어요. 서울에서 대면 선호합니다.'),

  (@U6, 'Java,Spring,React',       2, 4, 'MIXED',   4, 3, 'WANT',
   '기획+개발 가능한 팀장형 인재',
   '고려대 경영학 재학 중이며 Spring 백엔드 개발 경험 보유. 팀을 이끌 준비가 되어있어요.')

ON DUPLICATE KEY UPDATE
  skills_csv          = VALUES(skills_csv),
  experience_level    = VALUES(experience_level),
  intensity_level     = VALUES(intensity_level),
  online_offline_pref = VALUES(online_offline_pref),
  team_vibe           = VALUES(team_vibe),
  feedback_style      = VALUES(feedback_style),
  leadership_pref     = VALUES(leadership_pref),
  appeal_title        = VALUES(appeal_title),
  appeal_content      = VALUES(appeal_content);

-- ──────────────────────────────────────────────────────────────
-- 9. 공모전 후보 등록 (contest_participants)
--    → getCandidates() 가 이 테이블에서 후보 목록을 가져옴
-- ──────────────────────────────────────────────────────────────
INSERT INTO contest_participants
  (contest_id, user_id, skills_csv, experience_level, intensity_level,
   online_offline_pref, regions_snapshot, team_vibe, feedback_style,
   leadership_pref, appeal_title, appeal_content, created_at, updated_at)
VALUES
  (@CONTEST_ID, @U1, 'React,TypeScript,Figma', 2, 2, 'MIXED',   '서울|강남구',   5, 4, 'IF_NEEDED', '열정 넘치는 개발자!',         '뽑아만 주신다면 열심히 참여하겠습니다🔥', NOW(), NOW()),
  (@CONTEST_ID, @U2, 'React,TypeScript,Figma', 1, 1, 'MIXED',   '서울|마포구',   3, 3, 'DONT_WANT', '트렌드에 민감한 디자이너!',   '디자인으로 팀의 완성도를 높여드릴게요.',  NOW(), NOW()),
  (@CONTEST_ID, @U3, 'React,TypeScript',       0, 2, 'MIXED',   '서울|강남구',   4, 2, 'IF_NEEDED', '열심히 하겠습니다!',          '첫 공모전이라 열정만큼은 누구에게도 지지 않아요.', NOW(), NOW()),
  (@CONTEST_ID, @U4, 'Python,Django,React',    2, 3, 'ONLINE',  '부산|해운대구', 5, 3, 'WANT',      'AI/ML 개발자',                'Python 5년차, AI 프로젝트 경험 있습니다.', NOW(), NOW()),
  (@CONTEST_ID, @U5, 'Figma,Photoshop,Zeplin',1, 2, 'OFFLINE', '서울|종로구',   3, 4, 'DONT_WANT', '감각 있는 UI 디자이너',       '서울에서 대면 선호합니다.',               NOW(), NOW()),
  (@CONTEST_ID, @U6, 'Java,Spring,React',      2, 4, 'MIXED',   '서울|서초구',   4, 3, 'WANT',      '기획+개발 가능한 팀장형 인재', '팀을 이끌 준비가 되어있어요.',            NOW(), NOW())
ON DUPLICATE KEY UPDATE
  updated_at = NOW();

-- ──────────────────────────────────────────────────────────────
-- 10. 확인
-- ──────────────────────────────────────────────────────────────
SELECT u.id, u.nickname, u.gender, mp.online_offline_pref, mp.experience_level,
       r.sido, r.sigungu, cp.contest_id
FROM users u
JOIN contest_participants cp ON u.id = cp.user_id AND cp.contest_id = @CONTEST_ID
LEFT JOIN matching_profile mp ON u.id = mp.user_id
LEFT JOIN user_region r ON u.id = r.user_id
WHERE u.kakao_id BETWEEN 99901 AND 99906
ORDER BY u.id;
