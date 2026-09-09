-- ============================================================
-- 가짜 성장 지표 시드 데이터 (인재풀 50명 + 모집글 10개 + 좋아요/댓글)
--
-- 목적: 초기 베타 유입 부스트용 — 실사용자에게는 실제 활동으로 보이는 더미 데이터.
--       실사용자 계정/데이터는 전혀 건드리지 않는다(가짜 유저끼리만 좋아요/댓글).
--
-- 실행 방법: 운영 DB에 직접 접속해서(mysql client, DB GUI 등) 이 파일 전체를 그대로 실행.
--           트랜잭션으로 감싸져 있어 중간에 에러가 나면 전부 롤백된다(부분 반영 없음).
--           재실행해도 안전하도록 최대한 방어적으로 짰지만(NOT EXISTS 가드 등),
--           유저/모집글 INSERT 자체는 재실행 시 중복 생성되니 원칙적으로 1회만 실행할 것.
--
-- 가짜 유저 식별 방법: kakao_id BETWEEN 991001 AND 991050
--                     (기존 테스트 유저 kakao_id 99901~99906과 겹치지 않는 새 대역)
--
-- 50명 중 10명은 matching_profile을 아예 안 만든다(실제로도 매칭 프로필을 안 채운 유저가
-- 많음) — 다만 그중 누군가 "지원했는데 확인 부탁드려요" 댓글로 실제 지원자가 되면
-- (post_applications 생성), 그 사람만 뒤늦게 matching_profile을 채워 넣는다(섹션 7-2) —
-- 실제 지원 데이터의 참여정보가 비어 보이면 앞뒤가 안 맞으므로.
--
-- 실행 후 아래 "9. 결과 요약" 섹션의 SELECT들로 실제 반영된 개수를 확인할 것.
-- ============================================================

USE teamit;

START TRANSACTION;

SET @seed_start_time = NOW();
SET @terms_version = '2026-08-15';

-- ──────────────────────────────────────────────────────────────
-- 1. 가짜 인재풀 원본 데이터 (임시 테이블) — 이후 모든 INSERT가 이 테이블을 참조한다
-- ──────────────────────────────────────────────────────────────
DROP TEMPORARY TABLE IF EXISTS tmp_fake_users;
CREATE TEMPORARY TABLE tmp_fake_users (
  kakao_id BIGINT PRIMARY KEY,
  nickname VARCHAR(20),
  real_name VARCHAR(50),
  gender VARCHAR(10),
  birth_date DATE,
  school_name VARCHAR(100),
  major VARCHAR(100),
  sido VARCHAR(50),
  sigungu VARCHAR(50),
  skill1 VARCHAR(100),
  skill2 VARCHAR(100),
  skill3 VARCHAR(100),
  experience_level INT,
  intensity_level INT,
  online_offline_pref VARCHAR(20),
  team_vibe INT,
  feedback_style INT,
  leadership_pref VARCHAR(20),
  participation_purpose VARCHAR(20),
  appeal_title VARCHAR(200),
  appeal_content TEXT,
  -- 매칭 프로필을 아예 작성 안 한 실사용자도 많다 — 이 컬럼이 FALSE인 사람은 섹션 3에서
  -- matching_profile row 자체를 안 만든다(참여정보가 통째로 빈 상태). 다만 이 사람이 나중에
  -- "지원했는데 확인 부탁드려요" 댓글로 실제 지원자(post_applications)가 되면, 섹션 7-2에서
  -- 이 tmp 테이블의 데이터로 뒤늦게 채워 넣는다 — 실제 지원 데이터는 비어있으면 안 되므로.
  has_profile BOOLEAN
);

INSERT INTO tmp_fake_users
  (kakao_id, nickname, real_name, gender, birth_date, school_name, major, sido, sigungu,
   skill1, skill2, skill3, experience_level, intensity_level, online_offline_pref,
   team_vibe, feedback_style, leadership_pref, participation_purpose, appeal_title, appeal_content,
   has_profile)
VALUES
(991001, '몽글몽글', '김민준', 'MALE',   '2001-03-12', '서울대학교', '컴퓨터공학과', '서울', '관악구',
 'React', 'TypeScript', 'Node.js', 2, 3, 'MIXED', 3, 3, 'WANT', 'AWARD',
 '서울대학교 컴퓨터공학과에 다니고 있어요!',
 '프론트엔드와 백엔드를 모두 다룰 수 있는 풀스택 개발에 관심이 많습니다. React와 Node.js로 서비스를 처음부터 끝까지 만들어보는 걸 좋아해요. 이번엔 수상까지 진지하게 노려보고 싶습니다.', TRUE),

(991002, '라면킹', '이서연', 'FEMALE', '2000-07-04', '강원대학교', '산업디자인학과', '강원', '춘천시',
 'Figma', 'Photoshop', 'Illustrator', 1, 2, 'MIXED', 2, 4, 'IF_NEEDED', 'EXPERIENCE',
 '강원대학교에서 산업디자인을 전공하고 있어요.',
 'UI/UX 트렌드에 관심이 많고 Figma, 포토샵, 일러스트로 시안 작업까지 빠르게 진행할 수 있습니다. 디자인 공모전 참가 경험이 있어서 협업 과정도 익숙한 편입니다.', TRUE),

(991003, 'moon.light92', '박도윤', 'MALE',   '1999-11-21', '부산대학교', '소프트웨어학과', '부산', '금정구',
 'Java', 'Spring', 'SQL', 2, 4, 'OFFLINE', 4, 3, 'WANT', 'AWARD',
 '백엔드 개발이 강점이에요.',
 '부산대학교 소프트웨어학과에 재학 중이며 Java, Spring 기반 서버 개발 경험이 있습니다. 성과를 내는 팀 분위기를 선호하고, 필요하다면 팀을 이끄는 역할도 맡을 수 있습니다.', TRUE),

(991004, '감자밭지기', '최지우', 'FEMALE', '2002-01-09', '전남대학교', '경영학과', '광주', '북구',
 'PPT기획', '마케팅기획', 'SQL', 0, 2, 'ONLINE', 3, 3, 'DONT_WANT', 'EXPERIENCE',
 '기획과 자료조사 자신 있어요',
 '전남대학교 경영학과에 재학 중이며 마케팅 기획과 데이터 정리에 관심이 많습니다. 공모전 경험은 아직 없지만 아이디어 도출과 자료조사 역할에 적극적으로 참여하고 싶습니다.', FALSE),

(991005, '오늘도맑음', '정하준', 'MALE',   '2000-05-17', '한양대학교', '영상학과', '서울', '성동구',
 'Premiere Pro', 'After Effects', '영상편집', 1, 2, 'MIXED', 2, 2, 'IF_NEEDED', 'EXPERIENCE',
 '한양대학교 영상학과 다니는 사람입니다.',
 '유튜브 채널을 직접 운영하며 기획부터 촬영, 편집까지 해온 경험이 있습니다. 숏폼 콘텐츠 편집에 특히 자신 있습니다.', TRUE),

(991006, '이불밖은위험', '강수아', 'FEMALE', '2001-09-30', '충북대학교', '심리학과', '충북', '청주시',
 'UX리서치', 'PPT기획', NULL, 0, 1, 'ONLINE', 4, 4, 'DONT_WANT', 'EXPERIENCE',
 '리서치 해보고 싶어요',
 '충북대학교 심리학과에 재학 중이며, 전공을 살려 사용자 행동과 니즈를 분석하는 UX 리서치 분야에 관심이 많습니다. 인터뷰 설계와 자료 정리 역할로 참여하고 싶습니다. 온라인 참여만 가능한 점 참고 부탁드립니다.', TRUE),

(991007, 'cloudy_day', '조시우', 'MALE',   '1998-02-25', '카이스트', '전산학부', '대전', '유성구',
 'Python', 'Django', 'AWS', 2, 3, 'MIXED', 3, 2, 'WANT', 'AWARD',
 '전산학부에서 공부하는 대학생입니다.',
 '서버 인프라와 백엔드 아키텍처 설계에 관심이 많고 관련 프로젝트 경험이 많습니다. 진지하게 수상을 목표로 하는 팀을 찾고 있습니다.', TRUE),

(991008, '초코송이', '윤예은', 'FEMALE', '2002-04-14', '경북대학교', '시각디자인학과', '대구', '북구',
 'Illustrator', 'Photoshop', 'Figma', 1, 3, 'OFFLINE', 2, 3, 'IF_NEEDED', 'AWARD',
 '브랜딩 디자인 관심많은 사람입니다.',
 '경북대학교 시각디자인학과에 재학 중이며 로고, 브랜드 아이덴티티 작업 경험이 있습니다. 포트폴리오 보여드릴 수 있습니다!', TRUE),

(991009, '구름한조각', '장주원', 'MALE',   '2000-08-08', '인하대학교', '통계학과', '인천', '남구',
 '데이터분석', 'Python', 'SQL', 1, 2, 'MIXED', 3, 3, 'IF_NEEDED', 'EXPERIENCE',
 '데이터 인사이트 도출, 담당 가능합니다.',
 '인하대학교 통계학과에 재학 중이며 데이터 분석과 시각화에 관심이 많습니다. 자료조사와 분석 역할로 함께 성장할 수 있는 팀을 찾고 있습니다.', FALSE),

(991010, '밤샘장인', '임하은', 'FEMALE', '1999-12-02', '중앙대학교', '광고홍보학과', '서울', '동작구',
 '마케팅기획', 'PPT기획', 'SNS운영', 2, 2, 'MIXED', 3, 4, 'DONT_WANT', 'AWARD',
 '안녕하세요, 중앙대학교 광고홍보학과 학생입니다.',
 '광고홍보 동아리에서 2년간 활동하며 SNS 캠페인 기획과 실행 경험을 쌓았습니다. 마케팅 전략 수립과 발표 자료 구성에 자신 있습니다.', TRUE),

(991011, 'hazelnut.k', '한지훈', 'MALE',   '2001-06-19', '전북대학교', '컴퓨터공학과', '전북', '전주시',
 'Vue.js', 'JavaScript', 'CSS', 1, 3, 'ONLINE', 2, 2, 'IF_NEEDED', 'EXPERIENCE',
 '전북대학교 컴퓨터공학과 재학 중입니다.',
 '프론트엔드 개발을 공부하고 있고, 아직 실력은 부족하지만 실전 프로젝트를 통해 배우고 싶습니다. 온라인 참여만 가능합니다.', TRUE),

(991012, '딸기라떼', '오소율', 'FEMALE', '2002-10-27', '동아대학교', '영화영상학과', '부산', '사하구',
 '영상편집', 'Premiere Pro', NULL, 0, 2, 'OFFLINE', 2, 3, 'DONT_WANT', 'EXPERIENCE',
 '영상 편집하는 거 좋아합니다.',
 '동아대학교 영화영상학과에 재학 중이며 편집 실습 경험이 많습니다. 대면으로 촬영, 편집 작업하는 걸 선호합니다.', TRUE),

(991013, 'junseo.k', '서준서', 'MALE',   '2000-03-03', '아주대학교', '정보시스템학과', '경기', '수원시',
 'SQL', '데이터분석', 'Python', 1, 3, 'MIXED', 3, 3, 'WANT', 'AWARD',
 '정보시스템 전공, 아주대학교 다닙니다.',
 '데이터를 기반으로 의사결정하는 과정을 좋아하고, SQL과 파이썬으로 분석 업무를 해본 경험이 있습니다. 필요하다면 리더 역할도 맡을 수 있습니다.', TRUE),

(991014, '붕어빵장인', '신건우', 'MALE',   '1999-07-15', '계명대학교', '컴퓨터소프트웨어학부', '대구', '달서구',
 'Unity', 'C++', 'C#', 2, 4, 'OFFLINE', 4, 2, 'WANT', 'AWARD',
 '게임 개발 3년차 팀원입니다!',
 '계명대학교 컴퓨터소프트웨어학부에 재학 중이며 개인 게임 프로젝트를 출시해본 경험이 있습니다. 진지하게 수상을 노리는 팀을 원합니다.', FALSE),

(991015, '다은다은', '권다은', 'FEMALE', '2001-05-05', '국민대학교', '자동차운송디자인학과', '서울', '성북구',
 'Figma', 'UX리서치', 'Photoshop', 0, 2, 'MIXED', 2, 4, 'IF_NEEDED', 'EXPERIENCE',
 '국민대학교 자동차운송디자인학과생이에요 :)',
 'UX 디자인 공모전은 이번이 처음이라 서툰 부분이 있을 수 있지만, 전공을 살려 열심히해보겠습니다.', TRUE),

(991016, 'blue_whale7', '황유진', 'FEMALE', '1998-09-09', '울산대학교', 'AI융합학과', '울산', '남구',
 'Python', 'PyTorch', 'FastAPI', 2, 3, 'ONLINE', 3, 2, 'WANT', 'AWARD',
 '울산대학교 AI융합학과 재학생입니다!',
 '머신러닝 연구실 소속으로 관련 대회 입상 경험이 있습니다. 원격 협업에 익숙하고 모델 서빙까지 가능합니다.', TRUE),

(991017, '봄날의여백', '안은서', 'FEMALE', '2000-11-11', '숙명여자대학교', '경영학과', '서울', '용산구',
 'PPT기획', '프로젝트기획', NULL, 1, 2, 'MIXED', 3, 3, 'DONT_WANT', 'EXPERIENCE',
 '꼼꼼한 기획이 강점이에요.',
 '숙명여자대학교 경영학과에 재학 중이며 일정 관리와 문서화에 강점이 있습니다. 팀 분위기를 중요하게 생각합니다.', TRUE),

(991018, '붕붕이', '송수빈', 'FEMALE', '2002-02-18', '숭실대학교', '소프트웨어학부', '서울', '동작구',
 'React', 'Next.js', 'TypeScript', 1, 3, 'MIXED', 3, 3, 'IF_NEEDED', 'EXPERIENCE',
 '소프트웨어를 공부하고 있는 대학생이에요.',
 '사이드 프로젝트를 배포까지 진행해본 경험이 있습니다. 프론트엔드 개발로 참여하고 싶습니다.', TRUE),

(991019, '짤줍는사람', '류예린', 'FEMALE', '2001-01-23', '조선대학교', '미디어커뮤니케이션학과', '광주', '동구',
 '콘텐츠기획', 'SNS운영', '영상편집', 1, 2, 'ONLINE', 2, 4, 'DONT_WANT', 'AWARD',
 '콘텐츠 기획하고 운영하는 사람입니다.',
 '조선대학교 미디어커뮤니케이션학과에 재학 중이며 학과 홍보대사로 SNS 콘텐츠 기획과 운영을 담당했던 경험이 있습니다.', FALSE),

(991020, 'sunday_morning', '전태윤', 'MALE',   '1999-04-06', '인천대학교', '정보통신공학과', '인천', '연수구',
 'Java', 'Spring', 'Docker', 2, 3, 'MIXED', 4, 3, 'WANT', 'AWARD',
 '인천대학교 정보통신공학과에 다니고 있어요!',
 '인턴 경험을 통해 배포와 운영까지 다뤄본 백엔드 개발자입니다. 이번엔 수상을 목표로 진지하게 참여하고 싶습니다.', TRUE),

(991021, '노을맛집', '홍나은', 'FEMALE', '2002-06-30', '이화여자대학교', '디자인학부', '서울', '서대문구',
 'Figma', 'Illustrator', NULL, 0, 1, 'OFFLINE', 2, 4, 'IF_NEEDED', 'EXPERIENCE',
 '이화여자대학교 디자인학부 다니는 사람입니다.',
 '아직 신입이지만 새로운 디자인 트렌드를 배우는 걸 좋아합니다. 대면 모임 편하게 참여할 수 있습니다.', TRUE),

(991022, '오늘의할일', '고시은', 'FEMALE', '2000-09-13', '성균관대학교', '글로벌경영학과', '경기', '수원시',
 '프로젝트기획', 'PPT기획', '마케팅기획', 2, 3, 'MIXED', 3, 3, 'WANT', 'AWARD',
 '공모전 나가고 추억도 쌓을 팀원 구해요',
 '성균관대학교 글로벌경영학과에 재학 중이며 팀 프로젝트 리드 경험이 여러 번 있습니다. 아이디어 도출부터 발표 자료 구성까지 폭넓게 참여하고 싶습니다.', TRUE),

(991023, '고양이집사', '문지유', 'FEMALE', '2001-12-24', '경상국립대학교', '소프트웨어학과', '경남', '진주시',
 'Kotlin', 'Java', 'Android', 1, 2, 'MIXED', 2, 3, 'IF_NEEDED', 'EXPERIENCE',
 '경상국립대학교에서 소프트웨어를 전공하고 있어요.',
 '안드로이드 앱을 개인적으로 출시해본 경험이 있습니다. 배우면서 함께 성장하고 싶습니다.', TRUE),

(991024, '산책러버', '양민서', 'FEMALE', '1999-08-08', '서울여자대학교', '경영학과', '서울', '노원구',
 'PPT기획', '데이터분석', NULL, 0, 2, 'ONLINE', 3, 4, 'DONT_WANT', 'EXPERIENCE',
 '데이터 기반 기획, 담당하고 싶어요.',
 '서울여자대학교 경영학과에 재학 중이며 데이터 기반 기획에 관심이 많습니다. 공모전은 처음이라 자료조사와 분석 역할부터 배워가고 싶습니다.', FALSE),

(991025, '떡볶이러버', '손채은', 'FEMALE', '2000-02-02', '목포대학교', '영상학과', '전남', '무안군',
 '영상편집', 'After Effects', '촬영', 2, 3, 'OFFLINE', 3, 2, 'IF_NEEDED', 'AWARD',
 '영상학 전공, 목포대학교 재학 중입니다.',
 '목포대학교 영상학과에 재학 중이며 단편영화 제작 경험이 있습니다. 촬영부터 편집까지 전 과정에 참여할 수 있습니다.', TRUE),

(991026, '만두킹', '배은우', 'MALE',   '1998-10-10', '연세대학교', '응용통계학과', '서울', '서대문구',
 '데이터분석', 'SQL', 'Python', 2, 4, 'MIXED', 4, 2, 'WANT', 'AWARD',
 '연세대학교 응용통계학과 재학생입니다!',
 '캐글 대회 참가 경험이 있고 데이터 분석과 모델링에 관심이 많습니다. 진지하게 수상을 노려볼 팀을 구합니다.', TRUE),

(991027, '크로플홀릭', '남하윤', 'FEMALE', '2002-03-27', '건국대학교', '컴퓨터공학과', '서울', '광진구',
 'React', 'JavaScript', 'CSS', 0, 2, 'MIXED', 3, 3, 'IF_NEEDED', 'EXPERIENCE',
 '컴퓨터공학 공부하는 대학생입니다.',
 '학교 수업으로만 프론트엔드를 배웠는데, 실전 프로젝트를 통해 실력을 키우고 싶습니다.', TRUE),

(991028, '젤리곰', '유서윤', 'FEMALE', '2001-07-17', '부경대학교', '경영학과', '부산', '남구',
 '마케팅기획', 'PPT기획', 'SNS운영', 1, 2, 'ONLINE', 2, 4, 'DONT_WANT', 'AWARD',
 '브랜드 마케팅, 같이 해보고 싶어요!',
 '부경대학교 경영학과에 재학 중이며 브랜드 서포터즈 활동 경험이 있습니다. 트렌드를 빠르게 캐치하는 편입니다.', TRUE),

(991029, '주말만기다림', '노지원', 'MALE',   '1999-05-05', '경희대학교', '소프트웨어융합학과', '서울', '동대문구',
 'Python', 'FastAPI', 'AWS', 2, 3, 'MIXED', 3, 3, 'WANT', 'EXPERIENCE',
 '클라우드 인프라가 강점이에요.',
 '경희대학교 소프트웨어융합학과에 재학 중이며 AWS 자격증을 보유하고 있습니다. 배포 자동화까지 가능합니다.', FALSE),

(991030, '호빵맨덕후', '표소민', 'FEMALE', '2000-01-01', '세종대학교', '시각디자인학과', '서울', '광진구',
 'Illustrator', 'Figma', 'Photoshop', 1, 2, 'MIXED', 2, 3, 'IF_NEEDED', 'EXPERIENCE',
 '안녕하세요, 세종대학교 시각디자인학과 학생입니다.',
 '다양한 스타일의 포트폴리오를 준비해뒀습니다. 편하게 연락 주시면 빠르게 시안 작업 가능합니다.', TRUE),

(991031, '두부한모', '진유나', 'FEMALE', '2001-11-11', '한림대학교', '경제학과', '강원', '춘천시',
 'PPT기획', '데이터분석', NULL, 1, 2, 'MIXED', 3, 3, 'DONT_WANT', 'EXPERIENCE',
 '경제학적으로 기획하는 사람입니다.',
 '한림대학교 경제학과에 재학 중이며 데이터를 근거로 논리적인 기획서를 쓰는 걸 좋아합니다. 공모전 참가 경험이 한 번 있습니다.', TRUE),

(991032, '계란후라이', '탁채린', 'FEMALE', '2002-08-19', '영남대학교', '영상디자인학과', '경북', '경산시',
 '영상편집', 'After Effects', '모션그래픽', 0, 2, 'OFFLINE', 2, 4, 'IF_NEEDED', 'EXPERIENCE',
 '모션그래픽, 배우면서 성장하고 싶어요!',
 '영남대학교 영상디자인학과에 재학 중이며 아직 배우는 단계지만 열심히 하겠습니다. 대면 작업을 선호합니다.', TRUE),

(991033, '체스러버', '변준영', 'MALE',   '1998-06-06', '포항공과대학교', '컴퓨터공학과', '경북', '포항시',
 'C++', 'Python', '알고리즘', 2, 4, 'ONLINE', 4, 2, 'WANT', 'AWARD',
 '포항공과대학교 컴퓨터공학과 재학 중입니다.',
 '알고리즘과 최적화 문제를 푸는 걸 좋아하고 관련 대회 참가 경험이 있습니다. 기술적으로 도전적인 프로젝트를 선호합니다.', TRUE),

(991034, 'paper_plane', '피민재', 'MALE',   '2000-04-24', '홍익대학교', '정보통신전자공학부', '서울', '마포구',
 'Swift', 'iOS', 'Flutter', 1, 3, 'MIXED', 3, 3, 'IF_NEEDED', 'EXPERIENCE',
 'iOS 앱 개발 가능합니다.',
 '홍익대학교 정보통신전자공학부에 재학 중이며 개인 앱을 스토어에 출시해본 경험이 있습니다.', FALSE),

(991035, '지환이형', '마지환', 'MALE',   '2001-09-09', '경성대학교', '경영학과', '부산', '남구',
 'PPT기획', '프로젝트기획', NULL, 0, 2, 'MIXED', 3, 3, 'DONT_WANT', 'EXPERIENCE',
 '경성대학교 경영학과생이에요 :)',
 '공모전 경험은 아직 없지만 기획과 자료조사 역할로 열심히 배우면서 참여하고 싶습니다.', TRUE),

(991036, 'tiny.stars', '천승우', 'MALE',   '1999-12-12', '순천대학교', '통계학과', '전남', '순천시',
 'SQL', '데이터분석', 'Tableau', 1, 3, 'ONLINE', 3, 2, 'WANT', 'AWARD',
 '데이터 시각화가 강점이에요.',
 '순천대학교 통계학과에 재학 중이며 Tableau로 시각화 작업까지 가능합니다. 결과물 퀄리티를 신경 쓰는 편입니다.', TRUE),

(991037, '크림빵', '길서연', 'FEMALE', '2002-05-15', '청주대학교', '신문방송학과', '충북', '청주시',
 '콘텐츠기획', 'SNS운영', NULL, 0, 1, 'ONLINE', 2, 4, 'DONT_WANT', 'EXPERIENCE',
 '신문방송을 공부하고 있는 대학생이에요.',
 '학과 홍보 계정을 운영하며 콘텐츠 기획 경험을 쌓았습니다. SNS 채널 운영 역할로 참여하고 싶습니다.', TRUE),

(991038, '오돌토돌', '설도현', 'MALE',   '2000-10-30', '대구대학교', '컴퓨터학부', '경북', '경산시',
 'Java', 'Spring', 'MySQL', 1, 2, 'MIXED', 2, 3, 'IF_NEEDED', 'EXPERIENCE',
 '대구대학교 컴퓨터학부 다니는 사람입니다.',
 '학교 프로젝트 위주로 백엔드를 공부해왔고, 이번 기회에 실전 경험을 쌓고 싶습니다.', TRUE),

(991039, 'quiet_town', '함수현', 'FEMALE', '1999-03-03', '신라대학교', '디자인경영학과', '부산', '사상구',
 'Figma', 'UX리서치', 'Photoshop', 2, 3, 'MIXED', 3, 3, 'WANT', 'AWARD',
 'UX 디자인 3년차 팀원입니다!',
 '신라대학교 디자인경영학과에 재학 중이며 실무 인턴 경험이 있습니다. 사용자 조사를 좋아하고 팀 리드도 가능합니다.', FALSE),

(991040, '만년배고픔', '옥기현', 'MALE',   '2001-02-14', '창원대학교', '영상학과', '경남', '창원시',
 '영상편집', 'Premiere Pro', '촬영', 1, 3, 'OFFLINE', 3, 2, 'IF_NEEDED', 'EXPERIENCE',
 '지역 촬영 다니는 거 좋아합니다.',
 '창원대학교 영상학과에 재학 중이며 지역 행사 영상 촬영과 편집을 다수 진행했습니다.', TRUE),

(991041, '잠이보약', '어나윤', 'FEMALE', '2000-07-27', '고려대학교', '경영학과', '서울', '성북구',
 '마케팅기획', 'PPT기획', NULL, 1, 2, 'MIXED', 2, 4, 'DONT_WANT', 'EXPERIENCE',
 '고려대학교 경영학과에 다니고 있어요!',
 '마케팅 인턴 경험이 있고 꼼꼼하게 챙기는 스타일입니다. 잘 부탁드립니다!', TRUE),

(991042, 'coco_bean', '옹재원', 'MALE',   '1998-11-11', '경기대학교', '컴퓨터과학과', '경기', '수원시',
 'React', 'Node.js', 'AWS', 2, 4, 'MIXED', 4, 2, 'WANT', 'AWARD',
 '컴퓨터과학 전공, 경기대학교 다닙니다.',
 '사이드 프로젝트를 여러 개 배포까지 진행해본 경험이 있습니다. 이번엔 수상을 진지하게 노려보고 싶습니다.', TRUE),

(991043, '유빈이당', '옥유빈', 'FEMALE', '2002-04-04', '광운대학교', '디지털미디어디자인학과', '서울', '노원구',
 'Figma', 'Illustrator', 'Photoshop', 0, 2, 'MIXED', 2, 4, 'IF_NEEDED', 'EXPERIENCE',
 '디지털미디어디자인 공부하는 대학생입니다.',
 '실습 위주 학교라 툴을 다루는 건 자신 있습니다. 편하게 연락 주세요.', TRUE),

(991044, '계란말이', '방성민', 'MALE',   '2001-08-08', '서경대학교', '소프트웨어학부', '서울', '성북구',
 'Vue.js', 'TypeScript', 'CSS', 1, 2, 'ONLINE', 3, 3, 'IF_NEEDED', 'EXPERIENCE',
 '소프트웨어 전공임',
 '학교 동아리에서 프론트엔드 파트를 맡았던 경험이 있습니다. 함께 성장하고 싶습니다.', FALSE),

(991045, 'misty_hill', '추가은', 'FEMALE', '2000-06-16', '명지대학교', '경영학과', '경기', '용인시',
 'PPT기획', '프로젝트기획', 'SQL', 1, 2, 'MIXED', 3, 3, 'DONT_WANT', 'EXPERIENCE',
 '기획 공모전 나가고 싶습니다',
 '명지대학교 경영학과에 재학 중이며 일정표와 문서 정리에 강점이 있습니다. 무난하게 잘 맞춰가는 편입니다.', TRUE),

(991046, '올리브', '위동현', 'MALE',   '1999-01-19', '단국대학교', '컴퓨터공학과', '경기', '용인시',
 'Java', 'Spring', 'Docker', 1, 3, 'MIXED', 3, 3, 'IF_NEEDED', 'EXPERIENCE',
 '안녕하세요, 단국대학교 컴퓨터공학과 학생입니다.',
 '인턴을 준비하면서 사이드 프로젝트로 백엔드 실무 경험을 쌓고 있습니다.', TRUE),

(991047, '올빼미생활', '독고보라', 'FEMALE', '2001-10-10', '가천대학교', '시각디자인학과', '경기', '성남시',
 'Illustrator', 'Photoshop', NULL, 0, 2, 'OFFLINE', 2, 4, 'IF_NEEDED', 'EXPERIENCE',
 '가천대학교 시각디자인학과생이에요 :)',
 '색감이 좋다는 얘기를 자주 듣습니다. 캘리그라피도 조금 할 줄 알고, 대면 작업을 선호합니다.', TRUE),

(991048, 'honey_jar', '견태호', 'MALE',   '2000-12-05', '상명대학교', '산업경영공학과', '서울', '종로구',
 '데이터분석', 'PPT기획', 'SQL', 2, 3, 'MIXED', 3, 3, 'WANT', 'AWARD',
 '데이터와 기획 둘 다 담당 가능합니다.',
 '상명대학교 산업경영공학과에 재학 중이며 데이터 분석과 기획을 모두 할 수 있습니다. 팀 리드 경험도 있습니다.', TRUE),

(991049, '별사탕', '연수민', 'FEMALE', '2002-09-23', '제주대학교', '영화영상학과', '제주', '제주시',
 '영상편집', '촬영', 'After Effects', 1, 2, 'OFFLINE', 2, 3, 'IF_NEEDED', 'EXPERIENCE',
 '영상 스토리텔링 좋아하는 사람입니다.',
 '제주대학교 영화영상학과에 재학 중이며 단편 영상 제작 경험이 몇 번 있습니다.', FALSE),

(991050, 'wander.log', '기창의', 'MALE',   '1999-02-28', '가천대학교', '컴퓨터공학과', '경기', '성남시',
 'Kotlin', 'Java', 'Spring', 2, 3, 'MIXED', 3, 2, 'WANT', 'AWARD',
 '안드로이드와 백엔드 둘 다 하는 팀원입니다!',
 '가천대학교 컴퓨터공학과에 재학 중이며 앱 출시 경험이 있고 서버 개발도 어느 정도 가능합니다. 진지하게 참여하겠습니다.', TRUE);

-- ──────────────────────────────────────────────────────────────
-- 2. users (신규 50명)
-- ──────────────────────────────────────────────────────────────
INSERT INTO users
  (kakao_id, nickname, name, gender, birth_date, is_matching_active, role,
   terms_agreed_at, terms_version, analytics_opt_in, created_at, updated_at)
SELECT
  kakao_id, nickname, real_name, gender, birth_date, TRUE, 'USER',
  @seed_start_time, @terms_version, FALSE, @seed_start_time, @seed_start_time
FROM tmp_fake_users;

-- 방금 넣은 50명의 실제 user.id를 이후 모든 INSERT에서 재사용
DROP TEMPORARY TABLE IF EXISTS tmp_fake_user_ids;
CREATE TEMPORARY TABLE tmp_fake_user_ids AS
SELECT id FROM users WHERE kakao_id BETWEEN 991001 AND 991050;

-- ──────────────────────────────────────────────────────────────
-- 3. education / user_region / matching_profile / user_skills
--    인재풀 목록(UserService.getUserPool)에 뜨려면 name + is_matching_active=true면 충분하지만,
--    카드/상세정보가 자연스럽게 보이도록 세트로 채운다. verified는 의도적으로 전부 FALSE
--    (실제 인증 배지처럼 보이면 기만 정도가 더 커지므로).
--    matching_profile은 has_profile=TRUE인 사람만 채운다 — 실제로도 마이페이지에서
--    매칭 프로필을 아예 작성 안 한 유저가 많다. has_profile=FALSE인 10명은 학교/지역/
--    보유 스킬(user_skills)까지는 있지만 참여정보(강도/온오프라인/어필글 등)는 비어 보인다.
-- ──────────────────────────────────────────────────────────────
INSERT INTO education (user_id, school_name, status, major_type, major, verified, verification_status)
SELECT u.id, t.school_name, 'ATTENDING', 'SINGLE', t.major, FALSE, 'NONE'
FROM users u JOIN tmp_fake_users t ON u.kakao_id = t.kakao_id;

INSERT INTO user_region (user_id, sido, sigungu)
SELECT u.id, t.sido, t.sigungu
FROM users u JOIN tmp_fake_users t ON u.kakao_id = t.kakao_id;

INSERT INTO matching_profile
  (user_id, skills_csv, experience_level, intensity_level, online_offline_pref,
   team_vibe, feedback_style, leadership_pref, participation_purpose, appeal_title, appeal_content)
SELECT u.id,
       CONCAT_WS(',', t.skill1, t.skill2, t.skill3),
       t.experience_level, t.intensity_level, t.online_offline_pref,
       t.team_vibe, t.feedback_style, t.leadership_pref, t.participation_purpose,
       t.appeal_title, t.appeal_content
FROM users u JOIN tmp_fake_users t ON u.kakao_id = t.kakao_id
WHERE t.has_profile = TRUE;

-- MySQL은 TEMPORARY TABLE을 한 문장 안에서 두 번 이상 참조하면 "Can't reopen table" 에러를
-- 낸다(UNION ALL로 묶어도 한 문장으로 취급됨) — 그래서 UNION 대신 문장을 3개로 쪼갠다.
INSERT INTO user_skills (user_id, skill_id, skill_name_custom)
SELECT u.id, NULL, t.skill1 FROM users u JOIN tmp_fake_users t ON u.kakao_id = t.kakao_id WHERE t.skill1 IS NOT NULL;

INSERT INTO user_skills (user_id, skill_id, skill_name_custom)
SELECT u.id, NULL, t.skill2 FROM users u JOIN tmp_fake_users t ON u.kakao_id = t.kakao_id WHERE t.skill2 IS NOT NULL;

INSERT INTO user_skills (user_id, skill_id, skill_name_custom)
SELECT u.id, NULL, t.skill3 FROM users u JOIN tmp_fake_users t ON u.kakao_id = t.kakao_id WHERE t.skill3 IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 4. 모집글 10개 — 작성자는 위 50명 중 무작위. contest_id는 운영 DB에 실제 존재하는
--    "마감 안 된" 공모전 중에서 주제가 맞는 것으로 직접 골라 고정값으로 넣었다
--    (2026-09-10 기준 조회한 목록, contests.id 기준 — 이후 그 공모전이 삭제/마감되면
--    이 스크립트도 다시 확인해야 함).
-- ──────────────────────────────────────────────────────────────
DROP TEMPORARY TABLE IF EXISTS tmp_new_posts_src;
CREATE TEMPORARY TABLE tmp_new_posts_src (
  seq INT PRIMARY KEY,
  contest_id BIGINT,
  title VARCHAR(255),
  description TEXT,
  recruit_count INT,
  deadline VARCHAR(20),
  online_offline VARCHAR(20),
  gender_condition VARCHAR(20),
  school_condition VARCHAR(20),
  experience_condition VARCHAR(50),
  purpose_condition VARCHAR(20),
  skill1 VARCHAR(100),
  skill2 VARCHAR(100),
  skill3 VARCHAR(100)
);

INSERT INTO tmp_new_posts_src VALUES
-- id 51: AI Championship 2026 (원티드, 크래프톤) · IT/STARTUP · 마감 2026-09-18
(1, 51, 'AI Championship 2026 나가실 백엔드/AI 개발자 구해요',
 '원티드×크래프톤이 주최하는 AI Championship 2026 준비 중입니다!\n백엔드/모델 서빙 쪽 도와주실 분 구해요. 경험 없어도 열정 있으면 콜! 🙌',
 3, '2026-09-15', 'MIXED', 'ANY', 'ANY', '공모전 경험 무관', '참여 목적 무관', 'Python', 'FastAPI', 'PyTorch'),

-- id 37: 2026 현대리바트 영챌린지(디자인·마케팅) · DESIGN/MARKETING · 마감 2026-09-13
(2, 37, '현대리바트 영챌린지 팀원 모집 (기획/디자인)',
 '현대리바트 영챌린지(디자인·마케팅 부문) 공모전에 나갈 팀원을 모집합니다.\n기획 1명은 확정되었으며, 디자이너와 마케팅 기획자를 추가로 구하고 있습니다. 수상까지 진지하게 준비할 예정입니다.',
 3, '2026-09-11', 'ONLINE', 'ANY', 'ANY', '공모전 경험자 선호', '수상 선호', '마케팅기획', 'PPT기획', 'Photoshop'),

-- id 44: 2026 낙동강유역환경청 캐릭터 디자인 공모전 · DESIGN · 마감 2026-09-30
(3, 44, '낙동강유역환경청 캐릭터 디자인 공모전 팀원 구해요',
 '낙동강유역환경청에서 주최하는 캐릭터 디자인 공모전 준비중!\n마스코트 디자인 도와줄 분, 기획 도와줄 분 구해요ㅎㅎ 같은 학교면 더 좋아요~',
 3, '2026-09-24', 'OFFLINE', 'ANY', 'SAME_SCHOOL', '공모전 경험 무관', '경험 선호', 'Illustrator', 'Figma', '프로젝트기획'),

-- id 15: 2026 금융 AI Challenge (금융보안원) · IT · 마감 2026-09-13
(4, 15, '금융보안원 AI Challenge 백엔드 개발자 구합니다',
 '금융보안원이 주최하는 2026 금융 AI Challenge를 준비하고 있습니다.\n프론트/기획은 확정되었고, 백엔드 1명이 급하게 필요합니다. Spring 경험자 우대합니다.',
 4, '2026-09-11', 'MIXED', 'ANY', 'ANY', '공모전 경험자 선호', '참여 목적 무관', 'Java', 'Spring', 'SQL'),

-- id 62: 2026 제9회 K-디자인콘서트 (인천광역시) · DESIGN/SOCIAL/STARTUP · 마감 2026-10-10
(5, 62, 'K-디자인콘서트 출품 디자이너 2명 모집',
 '인천광역시가 주최하는 K-디자인콘서트에 출품할 예정이에요.\n디자이너 2명 모집합니다. 리서치부터 같이 하실 분이면 더 좋아요 😊',
 3, '2026-10-02', 'OFFLINE', 'SAME', 'ANY', '공모전 경험 무관', '참여 목적 무관', 'Figma', 'UX리서치', NULL),

-- id 74: 2026 서대문구 숏폼 콘텐츠 공모전(신촌, 60초 설명서) · MARKETING/MEDIA/STARTUP · 마감 2026-10-09
(6, 74, '서대문구 숏폼 콘텐츠 공모전 영상편집자 구해요',
 '서대문구청 주최 숏폼 콘텐츠 공모전(신촌, 60초 설명서) 나가려구요! 기획은 다 짜놨는데 편집해주실 분이 없어서ㅠㅠ 같이 재밌게 만들어봐요!',
 2, '2026-10-01', 'ONLINE', 'ANY', 'ANY', '공모전 경험 무관', '경험 선호', 'Premiere Pro', 'After Effects', NULL),

-- id 7: 2026년 국민체육진흥공단 공공데이터 활용 경진대회 · IT · 마감 2026-10-02
(7, 7, '국민체육진흥공단 공공데이터 경진대회 팀원 모집',
 '국민체육진흥공단 공공데이터 활용 경진대회를 준비하고 있습니다.\n분석 및 시각화를 함께하실 분, 발표자료를 담당해주실 분을 구합니다.',
 3, '2026-09-25', 'MIXED', 'ANY', 'ANY', '공모전 경험자 선호', '수상 선호', 'Python', '데이터분석', 'SQL'),

-- id 82: 제3회 미래융합인재 발굴 소프트웨어 챌린지 (과학기술정보통신부) · ENGINEERING/IT/STARTUP · 마감 2026-10-07
(8, 82, '미래융합인재 소프트웨어 챌린지 프론트엔드 구합니다',
 '과학기술정보통신부 주최 미래융합인재 발굴 소프트웨어 챌린지 나갑니다.\n백엔드는 구했고 프론트엔드 개발자만 구해요! React 다루시는 분 환영입니다~',
 3, '2026-09-29', 'MIXED', 'ANY', 'ANY', '공모전 경험 무관', '참여 목적 무관', 'React', 'TypeScript', NULL),

-- id 52: AI와 함께하는 교통문제 해결을 위한 데이터 분석 공모전 (한겨레, 숲과나눔) · IT/SOCIAL/STARTUP · 마감 2026-10-22
(9, 52, '교통문제 해결 데이터분석 공모전 기획자 구해요',
 '한겨레·숲과나눔이 주최하는 교통문제 해결 데이터 분석 공모전을 준비하고 있습니다.\n기획과 데이터 분석 파트를 구합니다. 의미 있는 프로젝트 함께 만들어가요.',
 3, '2026-10-14', 'MIXED', 'ANY', 'ANY', '공모전 경험 무관', '경험 선호', '프로젝트기획', '데이터분석', NULL),

-- id 12: 메이플스토리 글로벌 개발 콘테스트 (넥슨) · IT · 마감 2026-10-07
(10, 12, '메이플스토리 글로벌 개발 콘테스트 같이 나갈 분 구합니다',
 '넥슨 주최 메이플스토리 글로벌 개발 콘테스트 준비중입니다! 기획자 1명 확정, 개발 되시는 분 구해요. Unity 다루시는 분이면 최고 ㅎㅎ',
 3, '2026-09-29', 'ONLINE', 'ANY', 'ANY', '공모전 경험자 선호', '참여 목적 무관', 'Unity', 'C++', NULL);

INSERT INTO posts
  (user_id, title, description, contest_id, recruit_count, status, deadline,
   online_offline, gender_condition, school_condition, experience_condition, purpose_condition,
   team_confirmed, view_count, created_at, updated_at)
SELECT
  (SELECT id FROM tmp_fake_user_ids ORDER BY RAND() LIMIT 1),
  s.title, s.description,
  -- 운영 DB 기준으로 골라둔 실제 공모전 id를 우선 쓰되(제목/내용이 그 공모전에 맞게 쓰여 있음),
  -- 이 스크립트를 돌리는 DB(로컬 등)에 그 id가 없으면 FK 위반이 나므로, 있는 경우에만 그대로
  -- 쓰고 없으면 그 DB에 실제로 존재하는 아무 공모전으로 안전하게 대체한다.
  COALESCE(
    (SELECT id FROM contests WHERE id = s.contest_id),
    (SELECT id FROM contests ORDER BY RAND() LIMIT 1)
  ),
  s.recruit_count, 'OPEN', s.deadline,
  s.online_offline, s.gender_condition, s.school_condition, s.experience_condition, s.purpose_condition,
  FALSE, 0, @seed_start_time, @seed_start_time
FROM tmp_new_posts_src s;

-- 방금 넣은 10개 모집글의 실제 id 확보 (제목 + 시딩 시작 시각 기준으로 특정)
DROP TEMPORARY TABLE IF EXISTS tmp_new_post_ids;
CREATE TEMPORARY TABLE tmp_new_post_ids AS
SELECT p.id AS post_id, s.seq, s.skill1, s.skill2, s.skill3
FROM posts p
JOIN tmp_new_posts_src s ON p.title = s.title
WHERE p.created_at = @seed_start_time;

-- 위 user_skills와 동일한 이유(TEMPORARY TABLE 재참조 금지)로 UNION 대신 문장을 3개로 쪼갠다.
INSERT INTO post_skills (post_id, skill_id, skill_name_custom)
SELECT post_id, NULL, skill1 FROM tmp_new_post_ids WHERE skill1 IS NOT NULL;

INSERT INTO post_skills (post_id, skill_id, skill_name_custom)
SELECT post_id, NULL, skill2 FROM tmp_new_post_ids WHERE skill2 IS NOT NULL;

INSERT INTO post_skills (post_id, skill_id, skill_name_custom)
SELECT post_id, NULL, skill3 FROM tmp_new_post_ids WHERE skill3 IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 4-1. 모집글을 쓰면 실제 앱(PostService.createPost)은 그 공모전에 작성자를 자동으로
--      참여카드(ContestParticipant) 후보로 등록시킨다. 이 스크립트는 posts를 raw SQL로
--      직접 넣어서 그 사이드이펙트가 빠져있었으므로 여기서 동일하게 채워 넣는다 —
--      has_profile=FALSE라서 matching_profile이 없는 사람이 모집글 작성자가 되더라도
--      "상세 정보"에서 참여정보가 완전히 빈 채로 보이지 않도록(UserService.getUserDetail의
--      최근 참여카드 폴백과 맞물려 동작).
-- ──────────────────────────────────────────────────────────────
INSERT INTO contest_participants
  (contest_id, user_id, skills_csv, experience_level, intensity_level, online_offline_pref,
   regions_snapshot, team_vibe, feedback_style, leadership_pref, participation_purpose,
   appeal_title, appeal_content, created_at, updated_at)
SELECT p.contest_id, p.user_id,
       CONCAT_WS(',', t.skill1, t.skill2, t.skill3),
       t.experience_level, t.intensity_level, t.online_offline_pref,
       CONCAT(t.sido, '|', COALESCE(t.sigungu, '')),
       t.team_vibe, t.feedback_style, t.leadership_pref, t.participation_purpose,
       t.appeal_title, t.appeal_content, @seed_start_time, @seed_start_time
FROM posts p
JOIN users u ON u.id = p.user_id
JOIN tmp_fake_users t ON t.kakao_id = u.kakao_id
WHERE p.created_at = @seed_start_time
  AND p.contest_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contest_participants cp WHERE cp.contest_id = p.contest_id AND cp.user_id = p.user_id
  );

-- ──────────────────────────────────────────────────────────────
-- 5. 좋아요/댓글 대상 모집글 최대 30개 = 신규 10개 + 마감되지 않은 기존 모집글
--    (status='OPEN' 이고 deadline이 지나지 않은 글), 최근 생성순으로 최대 30개.
-- ──────────────────────────────────────────────────────────────
DROP TEMPORARY TABLE IF EXISTS tmp_target_posts;
CREATE TEMPORARY TABLE tmp_target_posts AS
SELECT id AS post_id
FROM posts
WHERE status = 'OPEN'
  AND (deadline IS NULL OR deadline >= DATE_FORMAT(CURDATE(), '%Y-%m-%d'))
ORDER BY created_at DESC
LIMIT 30;

-- ──────────────────────────────────────────────────────────────
-- 6. 좋아요 — 가짜 유저 50명 × 대상 글 최대 30개, 유저당 글마다 16% 확률로 좋아요.
--    이항분포 특성상 글마다 자연스럽게 편차(대략 3~15개 안팎)가 생긴다.
--    UNIQUE(user_id, post_id) 위반 방지 + 재실행 안전을 위해 NOT EXISTS로 가드.
-- ──────────────────────────────────────────────────────────────
INSERT INTO post_hearts (user_id, post_id, created_at, updated_at)
SELECT fu.id, tp.post_id, NOW(), NOW()
FROM tmp_target_posts tp
CROSS JOIN tmp_fake_user_ids fu
WHERE RAND() < 0.16
  AND NOT EXISTS (
    SELECT 1 FROM post_hearts ph WHERE ph.user_id = fu.id AND ph.post_id = tp.post_id
  );

-- ──────────────────────────────────────────────────────────────
-- 7. 댓글 — 유저당 글마다 3% 확률로 댓글 하나(전부 조용한 글도 있게, 평균 1~2개/글 수준).
--    문구는 5종류뿐이라 실제 모집글에서 볼 법한 자연스러운 것들로 한정한다.
--    "팀원 다 구해지셨나요?"는 팀원을 많이 구하는 글(recruit_count>=3)에서만 나오게 조건부 처리.
-- ──────────────────────────────────────────────────────────────
INSERT INTO post_comments (post_id, author_id, content, created_at, updated_at)
SELECT tp.post_id, fu.id,
  CASE
    WHEN p.recruit_count >= 3 THEN
      ELT(1 + FLOOR(RAND() * 5),
        '팀원 다 구해지셨나요?',
        '주 몇 회 정도 미팅하나요?',
        '채팅 보냈습니다!',
        '지원했는데 확인 부탁드려요 ㅎㅎ',
        '포지션 아직 열려있나요?'
      )
    ELSE
      ELT(1 + FLOOR(RAND() * 4),
        '주 몇 회 정도 미팅하나요?',
        '채팅 보냈습니다!',
        '지원했는데 확인 부탁드려요 ㅎㅎ',
        '포지션 아직 열려있나요?'
      )
  END,
  NOW(), NOW()
FROM tmp_target_posts tp
JOIN posts p ON p.id = tp.post_id
CROSS JOIN tmp_fake_user_ids fu
WHERE RAND() < 0.03;

-- ──────────────────────────────────────────────────────────────
-- 7-1. "지원했는데 확인 부탁드려요 ㅎㅎ" 댓글을 단 사람은 실제로 그 글에 지원한 기록이
--      있어야 앞뒤가 맞는다 — 해당 (post, user) 조합마다 post_applications를 채워 넣는다.
-- ──────────────────────────────────────────────────────────────
INSERT INTO post_applications (post_id, user_id, appeal_text, status, is_pinned, created_at, updated_at)
SELECT DISTINCT c.post_id, c.author_id, '관심 있어서 지원합니다. 잘 부탁드려요!', 'PENDING', FALSE, NOW(), NOW()
FROM post_comments c
WHERE c.content = '지원했는데 확인 부탁드려요 ㅎㅎ'
  AND c.created_at = c.updated_at
  AND c.post_id IN (SELECT post_id FROM tmp_target_posts)
  AND NOT EXISTS (
    SELECT 1 FROM post_applications pa WHERE pa.post_id = c.post_id AND pa.user_id = c.author_id
  );

-- ──────────────────────────────────────────────────────────────
-- 7-2. has_profile=FALSE라서 matching_profile이 없는 사람이 방금 위에서 실제 지원자가
--      됐을 수 있다 — 진짜로 지원한 데이터는 참여정보가 비어있으면 안 되므로, 그런
--      사람만 골라 지금 시점에 matching_profile을 채워 넣는다.
-- ──────────────────────────────────────────────────────────────
INSERT INTO matching_profile
  (user_id, skills_csv, experience_level, intensity_level, online_offline_pref,
   team_vibe, feedback_style, leadership_pref, participation_purpose, appeal_title, appeal_content)
SELECT u.id,
       CONCAT_WS(',', t.skill1, t.skill2, t.skill3),
       t.experience_level, t.intensity_level, t.online_offline_pref,
       t.team_vibe, t.feedback_style, t.leadership_pref, t.participation_purpose,
       t.appeal_title, t.appeal_content
FROM post_applications pa
JOIN users u ON u.id = pa.user_id
JOIN tmp_fake_users t ON t.kakao_id = u.kakao_id
WHERE pa.appeal_text = '관심 있어서 지원합니다. 잘 부탁드려요!'
  AND NOT EXISTS (SELECT 1 FROM matching_profile mp WHERE mp.user_id = u.id);

-- ──────────────────────────────────────────────────────────────
-- 8. 정리
-- ──────────────────────────────────────────────────────────────
DROP TEMPORARY TABLE IF EXISTS tmp_fake_users;
DROP TEMPORARY TABLE IF EXISTS tmp_new_posts_src;

COMMIT;

-- ──────────────────────────────────────────────────────────────
-- 9. 결과 요약 — 실행 직후 이 SELECT들로 실제 반영된 개수를 확인할 것
-- ──────────────────────────────────────────────────────────────
SELECT COUNT(*) AS fake_users_created FROM users WHERE kakao_id BETWEEN 991001 AND 991050;

SELECT COUNT(*) AS fake_users_without_matching_profile
FROM users u
WHERE u.kakao_id BETWEEN 991001 AND 991050
  AND NOT EXISTS (SELECT 1 FROM matching_profile mp WHERE mp.user_id = u.id);

SELECT COUNT(*) AS new_posts_created FROM posts WHERE created_at = @seed_start_time;

SELECT p.id AS post_id, p.title,
       (SELECT COUNT(*) FROM post_hearts h WHERE h.post_id = p.id) AS heart_count,
       (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) AS comment_count
FROM posts p
JOIN tmp_target_posts tp ON tp.post_id = p.id
ORDER BY heart_count DESC;

-- 한 SELECT에서 tmp_target_posts를 두 번 참조하면 또 "Can't reopen table"이 나므로 나눈다.
SELECT COUNT(*) AS total_hearts_added
FROM post_hearts h JOIN tmp_target_posts tp ON tp.post_id = h.post_id;

SELECT COUNT(*) AS total_comments_added
FROM post_comments c JOIN tmp_target_posts tp ON tp.post_id = c.post_id;

SELECT COUNT(*) AS total_applications_added
FROM post_applications pa WHERE pa.appeal_text = '관심 있어서 지원합니다. 잘 부탁드려요!';

DROP TEMPORARY TABLE IF EXISTS tmp_target_posts;
DROP TEMPORARY TABLE IF EXISTS tmp_fake_user_ids;
DROP TEMPORARY TABLE IF EXISTS tmp_new_post_ids;
