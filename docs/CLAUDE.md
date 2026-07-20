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
- **주요 컬러 (Primary)**: #FF6A1C
- **보조 컬러 (Sub)**: #FFF3E0, #FFF3ED
- **텍스트 컬러 (Text)**: #212121, #757575, #9E9E9E, #B8B8B8
- **배경 컬러 (Background)**: #FFFFFF, #F7F7F7
- **보더 컬러 (Border)**: #E0E0E0
- **폰트**: 시스템 폰트 기본 사용

### 디자인 원칙
- Home, Onboarding, Explore, Message, MyPage 등 프로젝트 내 모든 화면에 위 컬러 시스템을 동일하게 적용
- 새로운 화면/컴포넌트 작업 시에도 임의의 색상 추가 없이 위 컬러 팔레트만 사용

---

## 주요 화면 목록
- 온보딩: 스플래시 → 카카오 로그인 → 기본정보 → 지역 → 학력
- 홈: 매칭 현황, 인기 공모전
- 탐색: 인재풀 / 공모전 탭 (필터, 하트)
- 메시지: 단체채팅 / 1:1 채팅
- 내정보: 프로필, 경험, 기술스택, 매칭 프로필, 나의 매칭

# 티밋(Teamit) 개발 워크플로우 (AI 하네스 규칙)

이 프로젝트에서 Claude Code로 작업할 때는 아래 순서를 기본으로 한다.

## 1. Plan-first + Human Approval Gate

- 세션 기본 권한 모드는 `plan` (`settings.json`의 `permissions.defaultMode: "plan"`).
  Claude는 코드를 바로 수정하지 않고 먼저 조사/계획만 하고 멈춘다.
- 계획이 나오면 사람이 검토 후 승인해야 실제 구현(수정 권한)으로 전환된다.
  (승인 시 Shift+Tab으로 전환되거나, 계획 승인 프롬프트에서 진행 모드 선택)
- 범위가 큰 작업일수록 계획 단계에서 "변경 파일 목록"과 "건드리지 않을 범위"를 반드시 명시하게 한다.
## 2. 역할 분리 (Researcher → Planner → 구현 → Reviewer)

새 기능/버그 수정/리팩터링은 아래 순서로 진행한다.

1. **Researcher** 서브에이전트로 관련 코드/문서 조사 (읽기 전용)
2. **Planner** 서브에이전트로 계획 수립 (읽기 전용, 실행 안 함) → 사람 승인
3. 승인된 계획대로 메인 세션(또는 별도 구현 담당)이 실제 구현
4. **Reviewer** 서브에이전트로 diff 검토 (읽기 전용 + 테스트 실행만) → 커밋/PR 전 최종 확인
   구현과 검증을 같은 컨텍스트에서 하지 않는 것이 핵심이다. Reviewer는 항상 새 세션/서브에이전트로 호출해서
   구현 과정의 편향(자기가 짠 코드를 스스로 정당화하는 것)을 줄인다.

## 3. 프롬프트/도구 사용 로그

- `.claude/hooks/log_event.py` 가 UserPromptSubmit / PreToolUse / PostToolUse 훅으로 등록되어 있다.
- 모든 프롬프트, 호출된 도구, 도구 입력/결과가 프로젝트 루트의 `logs/claude-audit.jsonl` 에 한 줄씩(JSONL) 기록된다.
- 문제 발생 시 `logs/claude-audit.jsonl` 을 시간순으로 확인하면 어떤 질문 → 어떤 조사/계획 → 어떤 파일 수정 → 어떤 명령 실행으로 이어졌는지 추적 가능하다.
- `logs/` 는 `.gitignore` 에 추가하거나, 팀 감사 목적이라면 별도 저장소/스토리지로 주기적으로 옮기는 것을 권장한다.
## IntelliJ(JetBrains 플러그인)에서 사용 시 참고

- JetBrains 플러그인은 내부적으로 동일한 Claude Code CLI를 IDE 터미널에서 구동하므로
  `.claude/settings.json`, `.claude/agents/*.md`, `.claude/hooks/*` 설정이 그대로 적용된다.
- 모드 전환(Shift+Tab)도 CLI와 동일하게 동작한다.
- 서브에이전트 파일은 세션 시작 시 로드되므로, `.claude/agents/`에 새 파일을 추가했다면 IntelliJ에서 세션을 재시작해야 인식된다.