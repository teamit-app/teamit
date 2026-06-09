# 티밋(Teamit) 프로젝트 가이드

## 서비스 소개
티밋은 공모전/스타트업/프로젝트 팀원을 매칭해주는 모바일 앱이야.
- iOS / Android 동시 지원
- 사용자가 인재풀에서 팀원을 찾거나, 공모전에 팀 매칭 제의를 받을 수 있어

---

## 기술 스택

### 프론트엔드 (apps/mobile)
- React Native + Expo
- TypeScript
- 더미 데이터로 UI 먼저 구현 → 백엔드 API 완성 후 연결

### 백엔드 (apps/server)
- Spring Boot (Java 17)
- Gradle
- MySQL

---

## 프로젝트 구조
```
teamit/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── apps/
│   ├── mobile/   ← 프론트엔드 (React Native + Expo)
│   └── server/   ← 백엔드 (Spring Boot)
├── docs/
│   └── api-spec.md   ← API 명세서 (반드시 참고)
└── CLAUDE.md
```

---

## API 명세서
**반드시 `docs/api-spec.md` 참고해서 작업해.**
- Base URL: `https://api.teamit.app/api/v1`
- 개발 중에는 인증 없이 API 호출
- 더미 데이터 구조는 api-spec.md의 Response Body 형식과 동일하게 맞춰줘

---

## 브랜치 전략
```
main      ← 배포 버전 (직접 push 금지)
develop   ← 개발 버전 (PR 머지 대상)
feature/작업이름-fe   ← 프론트 작업 브랜치
feature/작업이름-be   ← 백엔드 작업 브랜치
fix/버그이름-fe / fix/버그이름-be
```

### 작업 시작할 때마다
```bash
git checkout develop
git pull origin develop
git checkout -b feature/작업이름-fe
```

### 작업 중간중간
```bash
git add .
git commit -m "feat: 작업 내용"
git push origin feature/작업이름-fe
```

### PR은 무조건 develop으로
- main에 직접 push 절대 금지
- PR 제목에 `Closes #이슈번호` 필수

---

## 커밋 메시지 규칙
**항상 아래 Gitmoji 규칙 따라서 커밋 메시지 작성해줘.**
형식: `이모지 설명`

| 이모지 | 코드 | 사용 시점 |
|--------|------|----------|
| ✨ | `:sparkles:` | 새 기능 추가 |
| 🐛 | `:bug:` | 버그 수정 |
| 🚑 | `:ambulance:` | 긴급 수정 |
| 💄 | `:lipstick:` | UI/스타일 추가·수정 |
| 🎨 | `:art:` | 코드 구조/형태 개선 |
| ♻️ | `:recycle:` | 코드 리팩토링 |
| 📝 | `:memo:` | 문서 추가·수정 |
| 🎉 | `:tada:` | 프로젝트 시작 |
| ➕ | `:heavy_plus_sign:` | 의존성 추가 |
| ➖ | `:heavy_minus_sign:` | 의존성 제거 |
| 🔧 | `:wrench:` | 설정 파일 추가·수정 |
| 🔨 | `:hammer:` | 개발 스크립트 추가·수정 |
| 🗃 | `:card_file_box:` | DB 관련 수정 |
| 🔥 | `:fire:` | 코드·파일 삭제 |
| ⏪ | `:rewind:` | 변경 내용 되돌리기 |
| 🔀 | `:twisted_rightwards_arrows:` | 브랜치 합병 |
| 📦 | `:package:` | 컴파일 파일 추가·수정 |
| 🚚 | `:truck:` | 리소스 이동·이름 변경 |
| 💡 | `:bulb:` | 주석 추가·수정 |
| ✅ | `:white_check_mark:` | 테스트 추가·수정 |
| 🔒 | `:lock:` | 보안 이슈 수정 |
| 🙈 | `:see_no_evil:` | .gitignore 추가·수정 |
| ⚡️ | `:zap:` | 성능 개선 |
| 🌐 | `:globe_with_meridians:` | 국제화·현지화 |
| 📈 | `:chart_with_upwards_trend:` | 분석·추적 코드 추가·수정 |

**태그 목록 (소문자로 사용):**

| 태그 | 사용 시점 |
|------|----------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `build` | 빌드 관련 파일 수정 |
| `chore` | 그 외 자잘한 수정 |
| `ci` | CI 관련 설정 수정 |
| `docs` | 문서 수정 |
| `style` | UI 스타일 수정 |
| `refactor` | 코드 리팩토링 |
| `test` | 테스트 코드 수정 |
| `init` | 프로젝트 시작 |
| `release` | 릴리즈 |
| `plus` | 의존성 추가 |
| `minus` | 의존성 제거 |

**형식: `이모지 태그: 설명`**

**예시:**
```
✨ feat: 온보딩 로그인 화면 구현
🐛 fix: 프로필 이미지 업로드 오류 수정
➕ plus: React Navigation 패키지 설치
💄 style: 버튼 컬러 오렌지로 변경
📝 docs: API 명세서 업데이트
🗃 chore: users 테이블 birth_date 컬럼 추가
🎉 init: 프로젝트 초기 세팅
♻️ refactor: 인재풀 필터 로직 개선
🔧 build: Gradle 설정 수정
✅ test: 로그인 API 테스트 추가
```



---

## 디자인 가이드
- **메인 컬러**: #E8611A (오렌지)
- **보조 컬러**: #F4874B (밝은 오렌지), #C04F12 (어두운 오렌지)
- **텍스트**: #1A1A2E (다크), #555555 (그레이)
- **배경**: #F8F8F8 (라이트 그레이), #FFFFFF (화이트)
- **폰트**: 시스템 폰트 기본 사용

---

## 주요 화면 목록
- 온보딩: 스플래시 → 카카오 로그인 → 기본정보 → 지역 → 학력
- 홈: 매칭 현황, 인기 공모전
- 탐색: 인재풀 / 공모전 탭 (필터, 하트)
- 메시지: 단체채팅 / 1:1 채팅
- 내정보: 프로필, 경험, 기술스택, 매칭 프로필, 나의 매칭