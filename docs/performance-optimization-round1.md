# 성능 최적화 1라운드 (베타테스트 전)

베타테스트(약 50명) 전, 비용 증가 없이 체감 성능을 개선하기 위한 1순위 작업 기록. 실측 수치가 아닌 **적용 근거와 기대효과** 중심으로 정리한다. 실제 수치화된 개선 효과는 2순위(Actuator/모니터링 구축) 이후 확인 예정.

## 배경

- 인프라: AWS EC2 t3.small(vCPU 2, RAM 2GB) 위에 Spring Boot(app)와 MySQL 8이 docker-compose로 동거, 앞단 nginx(Certbot 관리)가 리버스 프록시. 프론트는 Expo 웹 빌드를 Vercel에 배포.
- 조사 결과 `docker-compose.yml`에 메모리 제한/JVM 힙 설정이 전혀 없어 app·mysql이 2GB를 제한 없이 두고 경쟁 중이었고, nginx에 gzip 압축이 없었으며, 프론트에는 클라이언트 데이터 캐싱이 전무해 화면 재방문마다 API를 재호출하고 있었다.

## 1. nginx gzip 압축

**변경:** `nginx-default.conf`의 `api.teamit.kr` 서버 블록에 `gzip on` 및 관련 설정 추가 (`application/json`, `text/css` 등 대상, `gzip_min_length 256`).

**왜:** JSON API 응답이 압축 없이 그대로 나가고 있었다. gzip은 서버 부하 대비 효과가 가장 크고 위험이 가장 적은 변경이라 1순위로 선택했다.

**기대효과:** 텍스트 기반 응답(JSON)은 통상 60~80% 압축되므로, 리스트/상세 API 응답의 다운로드 시간이 특히 느린 네트워크(모바일 데이터)에서 체감 가능한 수준으로 줄어든다. CPU 오버헤드는 `gzip_comp_level 6`(중간 수준)로 제한해 t3.small의 제한된 vCPU에 부담을 최소화했다.

**주의:** 이 파일은 배포 파이프라인(`deploy-server.yml`) 밖에 있어 EC2에는 수동 반영이 필요하다.

## 2. 백엔드 메모리/커넥션 튜닝

**변경:**
- `docker-compose.yml`: mysql `mem_limit: 400m` + `--innodb-buffer-pool-size=200M --max-connections=50`, app `mem_limit: 1000m` + `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=70.0 -XX:InitialRAMPercentage=50.0`
- `application.yml`: HikariCP `maximum-pool-size: 10`, `minimum-idle: 5`, `connection-timeout: 3000` 명시

**왜:** 컨테이너에 메모리 제한이 없으면 두 프로세스가 2GB를 놓고 예측 불가능하게 경쟁하다가, 트래픽이 몰리는 순간 OOM으로 하나가 죽거나 스왑이 발생해 응답이 급격히 느려질 위험이 있다. 각 컨테이너에 명시적 한도를 걸어 합계(1400m)를 2GB 이내로 고정하고, 나머지 600m는 OS·nginx 여유분으로 남겼다. HikariCP 풀은 기존에도 기본값(10)이 이미 안전한 수준이었지만, mysql `max-connections=50`과 맞물려 안전 마진을 코드로 명시해두었다.

**기대효과:** 트래픽 급증 시에도 메모리 부족으로 인한 컨테이너 재시작·스왑 스래싱을 방지해 응답 지연의 "꼬리"(p95/p99)를 안정화한다. 평상시 응답속도 자체보다는 **부하가 몰렸을 때의 안정성**을 높이는 변경이다.

## 3. 프론트 React Query 도입

**변경:** `apps/mobile`에 `@tanstack/react-query` 도입, `app/_layout.tsx`에 `QueryClientProvider` 추가(`staleTime: 30초`, `retry: false`). `home/index.tsx`, `home/notifications.tsx`, `explore/build-team/candidates.tsx`를 `useEffect`+`useState` 직접 페칭에서 `useQuery`/`useInfiniteQuery`로 전환.

**왜:** 기존엔 클라이언트 사이드 캐싱이 전혀 없어 같은 화면을 재방문할 때마다 동일한 API를 다시 호출하고 있었다. React Query는 캐시 키 기반으로 중복 요청을 막고, 짧은 시간 내 재방문 시 캐시된 데이터를 즉시 보여준다.

**기대효과:** 서버로 가는 불필요한 반복 요청이 줄어 (a) 사용자 입장에서는 화면 전환이 즉시 이루어지는 것처럼 보이고 (b) 서버 입장에서는 t3.small의 제한된 리소스로 처리해야 할 요청 수 자체가 줄어든다. `candidates.tsx`의 페이지네이션은 `useInfiniteQuery`로 전환해 "더보기" 시 페이지 상태를 수동 관리하던 코드도 함께 단순화했다.

## 4. `useExploreStore`(zustand) → React Query 이관

**변경:** 인재풀/공모전 탐색 데이터를 zustand로 손수 캐싱하던 `src/store/useExploreStore.ts`를 제거하고, `src/hooks/useExploreData.ts`의 React Query 기반 훅/함수(`useExploreContests`, `useExploreTalents`, `toggleTalentHeart`, `toggleContestHeart`, `markContestParticipant` 등)로 교체. 호출부 14곳(탐색 탭, 상세 화면, 좋아요 목록, 매칭 프로필 등) 갱신.

**왜:** 해당 스토어는 순수 클라이언트 상태 없이 100% 서버 데이터 + 그 위에 얹은 낙관적 업데이트/캐시 무효화 로직만 담고 있었다 — React Query가 표준으로 제공하는 기능을 직접 재구현한 상태였다. zustand는 클라이언트 전용 상태(필터, UI 토글 등)에 적합하고, 서버에서 가져온 데이터의 캐싱·재검증·낙관적 업데이트는 React Query가 전담하는 것이 아키텍처상 일관적이다.

**기대효과:** 중복 캐싱 로직 제거로 유지보수 부담 감소, 앱 전체가 하나의 데이터 페칭 패턴을 갖게 되어 신규 화면 추가 시 일관된 방식 적용 가능. 성능 관점에서는 기존 zustand 캐싱도 세션당 1회 로딩 정책이라 이미 중복 호출을 막고 있었으므로 체감 속도 차이보다는 **구조적 개선**의 의미가 크다.

## 다음 단계

- 이번 라운드는 gzip 압축률, 메모리 안정성, 캐싱으로 인한 요청 감소량을 **수치로 확인하지 않은 상태**다.
- 2순위 작업(Spring Boot Actuator + Micrometer 도입, CloudWatch 연동)을 통해 실제 응답시간(p50/p95), 캐시 히트율, 메모리 사용량 추이를 확인하고 이 문서에 실측치를 추가할 예정. (→ `docs/performance-optimization-round2.md` 참고)

## 추가 수정 (2라운드 점검 중 발견)

React Query 캐시 키 전수 점검 중 `['notifications']`가 userId로 구분되지 않고, 로그아웃 시에도 지워지지 않는다는 걸 확인했다. 같은 기기에서 로그아웃 후 다른 계정으로 바로 재로그인하면, 짧은 시간 동안 이전 유저의 알림 목록이 그대로 보일 수 있는 문제라 `useAuthStore.logout()`에 `queryClient.removeQueries({ queryKey: ['notifications'] })`를 추가했다. (`['matchingStatus', userId]`는 키에 userId가 포함돼 있어 원래부터 안전했다.)

## 추가 개선 — 이벤트 기반 캐시 무효화 + 탐색 탭 새로고침 트리거

`staleTime`(시간 기반)만으로는 "다른 사용자의 행동으로 바뀐 데이터"를 제때 못 잡아낸다는 한계가 있었다. 마침 이 앱에 채팅/알림용 STOMP 웹소켓이 이미 연결돼 있어서, 그 푸시 이벤트를 React Query 캐시 무효화에도 연결했다.

**구조:** `socket.ts`(전송 계층, STOMP 메시지 파싱만 담당)와 `src/services/realtimeEvents.ts`(반응 규칙, "이 알림이 오면 어떤 캐시를 무효화할지"를 선언적으로 관리)를 분리했다. 새 알림 종류나 새로 이 데이터를 구독하는 화면이 생기면 `realtimeEvents.ts`만 고치면 된다.

**연결한 것** (서버가 이미 해당 이벤트로 알림을 보내주는 경우):
- `['notifications']` — 모든 알림 타입
- `['matchingStatus', userId]` — `MATCH_PROPOSAL`/`PROPOSAL_RESPONSE`/`MATCH_SUCCESS` (지원/초대/수락·거절/팀확정)
- `['contestCandidates']`/`['allContestCandidates']` — `MATCH_PROPOSAL`(누가 내 모집글에 지원). 알림 payload에 `postId`가 없어 정확한 postId를 지정할 수 없으므로, postId 없이 prefix로 무효화해서 현재 열려있는 후보 화면만 자동으로 다시 불러오게 했다.

**연결 안 한 것**: `['popularContests']`/`['exploreContests']`/`['exploreTalents']` — 신규 공모전 등록, 인재풀 신규 등록에 대해서는 서버가 애초에 어떤 이벤트도 발행하지 않는다(관련 도메인 코드에 알림 생성 호출이 0건). 새 브로드캐스트 채널을 만드는 백엔드 작업이 필요해 이번 라운드 범위 밖으로 남겨뒀다.

**탐색 탭 새로고침**: 위 브로드캐스트가 없는 데이터(공모전/인재풀 목록)는 대신 세 가지 수동 트리거로 신선도를 관리한다 — 탭 재진입(`useFocusEffect`), 탭 재탭(`_layout.tsx`의 `tabPress` 리스너), 당겨서 새로고침(`RefreshControl`). 셋 다 `useExploreData.ts`의 `refetchExploreData()` 하나로 통일해서 호출한다.

## 추가 개선 — 재연결 안전망 / 로그아웃 캐시 정리 / staleTime 재조정

이벤트 기반 무효화를 실제로 붙이고 나서 검토하다 나온 지적 3가지를 반영했다.

1. **소켓 재연결 시 안전망.** 웹소켓이 끊긴 동안(앱 백그라운드, 네트워크 끊김)의 이벤트는 유실된다. STOMP 클라이언트의 `onConnect`(최초 연결 + 자동 재연결마다 호출됨)에서 `realtimeEvents.ts`의 `invalidateRealtimeCaches()`를 호출해서, 재연결 시점마다 이벤트 연동 캐시(`notifications`/`matchingStatus`/`contestCandidates`/`allContestCandidates`)를 한 번씩 무효화하는 안전망을 추가했다.
2. **이벤트 연동 쿼리의 staleTime 상향.** 이벤트 + 재연결 안전망이 신선도를 챙겨주므로, 기존 30초 기본값 대신 `REALTIME_STALE_TIME`(5분) 상수로 상향해서 배경 재요청을 줄였다. 이 staleTime은 "주된 갱신 수단"이 아니라 이벤트가 다 놓쳤을 때를 위한 보수적인 상한선일 뿐이다.
3. **로그아웃 시 `queryClient.clear()`로 전체 정리.** 유저별 쿼리 키가 늘어날수록 "로그아웃 때 뭘 지워야 하지"를 매번 챙겨야 하는 구조였다(실제로 `notifications` 하나를 빠뜨렸었다). 로그아웃 직후엔 캐시 재사용 가치가 없으므로 surgical하게 지우는 대신 통째로 비우는 것으로 교체했다.

**다음 단계로 남겨둔 것 (지금 규모에선 불필요):** 인기 모집글에 지원이 연달아 오면 `MATCH_PROPOSAL`마다 후보 목록 refetch가 나간다. 50명 베타 규모에선 무시해도 되지만, 트래픽이 커지면 이벤트 수신 쪽에 짧은 debounce(예: 2초 안에 여러 이벤트가 오면 1번만 무효화)를 두는 게 다음 단계다.
