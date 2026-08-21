# GA4 세션 유입 정보 커스텀 파라미터 (session_entry_*) 가이드

## 배경 / 왜 필요한가

Expo Router(React Native Web) 특성상 클라이언트 라우터의 URL 정리(예: `history.replaceState`)가
GTM/GA4 태그 발화보다 먼저 일어나는 경우가 있다. 이 경우 GA4 네이티브 세션 소스/매체가
URL의 UTM 파라미터를 읽지 못하고, 리퍼러 도메인 기반으로 잘못 채워진다.
(예: `tistory / referral`이어야 할 값이 `omg-emergency.tistory.com / referral`로 찍힘)

GA4 네이티브 세션 소스/매체 필드(`campaign_source` 등 예약 파라미터)를 직접 덮어써서 고치는
방법은 `(direct)/(none)` 충돌, 태그 시퀀싱 취약성 등 리스크가 커서 채택하지 않았다.

대신 GA4 예약 필드명과 겹치지 않는 **완전히 별도의 커스텀 파라미터**를 만들어, 세션 시작
시점의 정확한 유입 정보를 실어보내는 방식으로 우회한다.

**한계**: 이 방식은 GA4 기본 제공 리포트(트래픽 획득, 사용자 획득 등)의 세션 소스/매체 값
자체를 고치지 않는다. 해당 리포트는 여전히 리퍼러 기반 오분류가 발생할 수 있다. 정확한 유입
정보가 필요한 분석은 이번에 추가한 `session_entry_*` 커스텀 파라미터(Looker Studio 등 커스텀
리포트)를 기준으로 봐야 한다.

## first_touch_* 와의 차이

| 구분 | `first_touch_*` (기존) | `session_entry_*` (신규) |
|---|---|---|
| 저장소 | `localStorage` | `sessionStorage` |
| 저장 시점 | 유저 최초 방문 시 1회만 | 세션마다 최초 진입 시 1회 |
| 유지 기간 | 영구 (앱 재방문에도 유지) | 세션 동안만 (탭/브라우저 종료 시 소멸) |
| 코드 위치 | `apps/mobile/public/index.html` | `apps/mobile/public/index.html` (동일 지점, 별도 스크립트 블록) |
| 용도 | 유저 단위 최초 유입 분석 | 이번 세션의 모든 이벤트에 실리는 유입 정보 |

두 로직 모두 "라우터가 URL을 정리하기 전, 앱 최상위 진입점"이라는 같은 시점에서 URL을 읽지만,
저장 목적과 저장소가 다르므로 변수/함수/키 이름을 명확히 분리해 별도 `<script>` 블록으로 구현했다.

## 코드 위치

- [apps/mobile/public/index.html](../apps/mobile/public/index.html) — `session_entry_*` 캡처 + `session_entry_ready` dataLayer push (first_touch 스크립트 블록 바로 다음, GTM 스크립트 이전)

### 동작 요약

1. URL 쿼리에서 `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`을 읽는다.
2. `sessionStorage`에 `session_entry_source` 등 이미 값이 있으면 덮어쓰지 않는다 (세션 내
   내부 링크 이동으로 재진입해도 최초 캡처 값이 세션 종료까지 유지됨).
3. 캡처된 값이 하나라도 있으면 `session_entry_ready` 이벤트로 dataLayer에 push한다. 값이
   없는 필드는 push 객체에서 키 자체를 제외한다 (빈 문자열 금지).
4. UTM이 아예 없는 진입(재방문/직접 유입 등)에서는 push 자체가 발생하지 않는다.

### 알려진 한계 (보정하지 않고 감수)

`sessionStorage`의 생명주기(탭/브라우저 종료 시까지 유지)와 GA4의 실제 세션 판정 기준(30분
비활성 시 신규 세션)은 다르다. 30분 이상 비활성 후 GA4가 신규 세션으로 판정해도
`sessionStorage` 값은 그대로 남아있을 수 있다. 이번 스코프에서는 이 오차를 별도로 보정하지
않는다 — 데이터 이상 발생 시 원인 후보로 참고할 것.

---

## GTM 설정 (사람이 GTM UI에서 직접 해야 하는 작업)

코드로 자동화할 수 없는 부분이며, GTM 컨테이너 관리자가 직접 설정해야 한다.

### 1. 현재 GA4 태그 구조 확인
GTM 컨테이너에서 GA4 태그가 다음 중 어떤 방식인지 먼저 확인한다.
- (구) GA4 Configuration 태그 방식
- (신) Google 태그 + 설정 변수 방식

방식에 따라 5단계의 "Fields to Set" 설정 위치가 다르다 (Google 태그 방식은 설정 변수 쪽에서
공통 설정하거나, 이벤트 태그 개별로 설정 가능).

### 2. dataLayer 변수 5개 생성
변수(Variables) → 새로 만들기 → 데이터 영역 변수(Data Layer Variable)

| 변수 이름 | 데이터 영역 변수 이름 |
|---|---|
| `DLV - session_entry_source` | `session_entry_source` |
| `DLV - session_entry_medium` | `session_entry_medium` |
| `DLV - session_entry_campaign` | `session_entry_campaign` |
| `DLV - session_entry_content` | `session_entry_content` |
| `DLV - session_entry_term` | `session_entry_term` |

### 3. 트리거 생성
트리거(Triggers) → 새로 만들기 → 맞춤 이벤트(Custom Event)
- 이벤트 이름: `session_entry_ready`
- 이 트리거가 실행할 태그: GA4 이벤트 태그(또는 `session_entry_ready`를 GA4로 전달할 태그)

### 4. GA4 설정 태그의 Fields to Set에 커스텀 파라미터로 추가
**주의**: `campaign_source` 등 GA4 예약 필드가 아니라, 일반 이벤트 파라미터로 추가해야 한다.

GA4 설정 태그(또는 Google 태그 설정 변수) → Fields to Set → 다음 5개 행 추가:

| Field Name | Value |
|---|---|
| `session_entry_source` | `{{DLV - session_entry_source}}` |
| `session_entry_medium` | `{{DLV - session_entry_medium}}` |
| `session_entry_campaign` | `{{DLV - session_entry_campaign}}` |
| `session_entry_content` | `{{DLV - session_entry_content}}` |
| `session_entry_term` | `{{DLV - session_entry_term}}` |

Fields to Set에 설정하면 GA4 설정 태그가 실행되는 이후 모든 이벤트(해당 세션 동안)에 이
값들이 자동으로 실린다.

### 5. Tag Sequencing (Setup Tag)
`session_entry_ready` 이벤트를 발화시키는 태그가 GA4 설정 태그보다 먼저 실행되도록 순서를
강제한다.
- GA4 설정 태그 → Advanced Settings → Tag Sequencing → Fire a tag before this tag fires →
  `session_entry_ready`를 처리하는 태그 선택

이 방식은 순서가 약간 어긋나도 GA4 네이티브 세션 판별 자체에는 영향을 주지 않는다 (예약
필드를 건드리지 않으므로). 다만 값 누락을 방지하기 위해 시퀀싱은 설정해두는 것을 권장한다.

### 6. GA4 관리자 → 맞춤 정의 등록
GA4 관리자(Admin) → 데이터 표시 → 맞춤 정의(Custom definitions) → 맞춤 측정기준 만들기

5개 모두 다음과 같이 등록:
- 측정기준 이름: `session_entry_source` 등 (파라미터명과 동일하게 권장)
- **범위: 이벤트 (Event)** — 사용자(User) 스코프 아님
- 이벤트 매개변수: `session_entry_source` 등 (코드/GTM에서 실제로 보내는 파라미터명과 일치)

> `first_touch_*`는 사용자 스코프 맞춤 측정기준(계정당 25개 한도)을 쓰고 있고,
> `session_entry_*`는 이벤트 스코프 맞춤 측정기준(속성당 50개 한도)을 쓴다 — 서로 다른
> 한도를 사용하므로 한쪽이 한도에 가까워도 다른 쪽에 영향 없음.

---

## 테스트 체크리스트

배포/설정 후 아래 항목을 GA4 DebugView 등에서 반드시 확인한다.

- [ ] UTM 붙은 링크로 신규 세션 진입 시 `session_entry_ready` 이벤트가 정상 발생하는지
- [ ] 같은 세션 내 이후 다른 이벤트(`tab_select`, `like` 등)에도 `session_entry_*` 5개
      파라미터가 동일하게 실리는지 (Fields to Set이 세션 전체에 적용됐는지 검증하는 핵심 항목)
- [ ] UTM 없이 진입한 세션에서는 `session_entry_*` 파라미터가 아예 안 실리는지 (빈 문자열
      로 찍히면 안 됨)
- [ ] 같은 세션 내 내부 링크로 다른 페이지 이동 시 `session_entry_*` 값이 최초 진입 값
      그대로 유지되는지 (재캡처되어 바뀌면 실패)
- [ ] GA4 네이티브 "세션 소스/매체" 필드는 이번 작업과 무관하게 기존처럼 리퍼러 기반으로
      나오는지 (이 필드가 바뀌었다면 의도치 않은 부작용이 생긴 것이므로 재점검 필요)

체크리스트는 GTM/GA4 설정이 실제로 완료된 뒤 QA 담당자가 수행해야 하며, 코드 변경만으로는
검증할 수 없다 (GTM 컨테이너 게시 + GA4 맞춤 측정기준 등록이 선행되어야 함).

---

## Looker Studio 사용 가이드

기존 six-stage 퍼널 대시보드에 `session_entry_*`를 새 필터/측정기준으로 추가하는 방법:

1. **데이터 소스 갱신**: GA4 커넥터를 쓰는 기존 데이터 소스에서 필드 목록을 새로고침하면,
   GA4에 이벤트 스코프 맞춤 측정기준으로 등록한 `session_entry_source` 등 5개가 자동으로
   나타난다 (측정기준 이름 앞에 보통 접두사 없이 등록한 이름 그대로 노출됨).
2. **필터로 추가**: 대시보드 상단 컨트롤에 "드롭다운 목록" 컨트롤을 추가하고 측정기준을
   `session_entry_source` / `session_entry_medium` / `session_entry_campaign` 중 원하는
   것으로 지정하면, 퍼널 각 단계 차트가 해당 유입 정보로 필터링된다.
3. **표/차트에 측정기준으로 추가**: 기존 퍼널 단계별 표에 `session_entry_source`,
   `session_entry_medium`을 측정기준으로 추가하면 "이 세션이 실제로 어디서 들어왔는지"
   기준으로 단계별 전환율을 쪼개볼 수 있다 — 기존 GA4 기본 "세션 소스/매체" 필드 대신 이
   필드를 기준으로 삼아야 리퍼러 오분류 영향을 받지 않는다.
4. **주의**: 값이 비어 있는(=UTM 없이 들어온) 세션은 해당 이벤트에 `session_entry_*`
   파라미터 자체가 없으므로, Looker Studio에서는 보통 `(not set)` 또는 빈 값으로 표시된다.
   "직접 유입/재방문"을 별도로 구분하고 싶다면 이 값이 비어있는 행을 별도 세그먼트로 묶어서
   본다.
