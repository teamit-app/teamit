# 부하테스트 (k6)

3라운드에서 Redis 캐싱 + N+1 수정을 적용한 뒤, **t3.small이 베타 목표치(동시 사용자 50명)를 실제로 버티는지** 사전에 검증하기 위한 스크립트다. 모니터링(2라운드)이 "실사용 중 지금 상태"를 보여주는 거라면, 이건 "가상으로 트래픽을 만들어서 미리 확인"하는 용도 — 서로 대체재가 아니라 같이 써야 완전해진다(부하테스트 돌리는 동안 CloudWatch 대시보드를 같이 열어두면 어디서 병목이 나는지까지 보인다).

## 준비물

**k6 설치** (둘 중 하나):
```bash
# macOS
brew install k6

# Windows
choco install k6

# 설치 없이 Docker로도 가능
docker run --rm -i grafana/k6 run - <cached-reads.js
```

## 실행 방법

### 1) 로컬 (docker-compose, `local` 프로필) — 가장 안전, 먼저 이걸로 시작

```bash
# apps/server에서 로컬 스택 기동 (mysql/redis/app)
# SPRING_PROFILES_ACTIVE=local 이어야 dev-login이 활성화된다
./gradlew bootRun --args='--spring.profiles.active=local'

# 다른 터미널에서
k6 run cached-reads.js -e BASE_URL=http://localhost:8080/api/v1
```
`local` 프로필에서만 켜지는 `/api/v1/auth/dev/login`으로 스크립트가 알아서 테스트 토큰을 발급받는다.

### 2) 배포된 서버(prod) — 신중하게, 작은 규모부터

`prod`에는 dev-login이 없다(의도적 — `SecurityConfig`/`DevAuthController`가 `@Profile("local")`로 막혀 있음). 실제 로그인한 계정의 액세스 토큰을 직접 넘겨야 한다:

```bash
k6 run cached-reads.js \
  -e BASE_URL=https://api.teamit.kr/api/v1 \
  -e AUTH_TOKEN=여기에_실제_액세스_토큰 \
  -e TARGET_VUS=10
```

**주의사항:**
- **처음엔 `TARGET_VUS=10`처럼 작게 시작**하고, 문제없으면 20 → 50으로 점점 올릴 것. 한 번에 50 VU로 쏘지 말 것.
- 베타테스트 시작 전, 트래픽이 없는 시간대에 진행할 것 (실제 유저가 있는 상태에서 돌리면 그 유저들 경험에 영향을 줄 수 있음).
- 지금 인프라 한도를 넘어서면 이런 순서로 문제가 생길 수 있다: MySQL `max-connections=50` 근처에서 커넥션 대기 → HikariCP 풀(10개) 고갈 → 응답 지연. Redis는 `maxmemory 180mb`라 넘치면 오래된 캐시부터 자동으로 버려짐(`allkeys-lru`, 죽지는 않음).
- 돌리는 동안 EC2에 SSH 접속해서 `docker stats`로 mysql/redis/app 컨테이너 메모리를, CloudWatch 콘솔에서 `teamit` 네임스페이스의 `http.server.requests`(p95)와 `cache.gets`(히트율)를 같이 관찰하면 병목 지점을 바로 알 수 있다.

## 시나리오 구성

`cached-reads.js`는 3라운드에서 캐싱한 4개 API에 실제 트래픽 비율과 비슷하게 가중치를 둬서 섞어 보낸다:
- 40% 인기 공모전(`contestsPopular`)
- 30% 공모전 목록(`contestsList`, 페이지별)
- 20% 공모전 상세(`contestsDetail`)
- 10% 인재풀(`userPool`)

`SAMPLE_CONTEST_ID` 환경변수로 실제 존재하는 공모전 id를 지정해야 상세 조회가 정확히 캐시를 태운다(기본값 1).

## 결과 해석

k6가 끝나면 콘솔에 이런 지표가 나온다:
- `http_req_duration`(p95) — 이게 1라운드/2라운드 전(캐싱·N+1 수정 전)보다 확실히 낮아졌는지가 핵심 비교 대상
- `http_req_failed` — 실패율. 0%에 가까워야 정상
- `checks` — 각 API가 200을 잘 돌려줬는지

**이 결과를 캐싱 전과 비교하려면**: 지금 코드로 한 번 돌린 뒤, `git stash`로 3라운드 변경사항을 잠깐 되돌리고 다시 돌려서 두 결과를 나란히 놓고 비교하는 게 가장 정확하다. (혹은 이미 배포됐다면 CloudWatch에 남은 과거 지표와 비교)

## 한계 / 참고

- 이 스크립트는 로컬 개발 환경(k6, Docker)에서 실행해야 한다 — 지금 이 세션(샌드박스)에는 k6와 Docker가 둘 다 없어서 직접 실행/검증은 못 했다. 문법과 API 경로(`ContestController`/`UserController` 실제 매핑 기준)만 코드로 확인했다.
- 인증이 필요한 GET 엔드포인트라 토큰이 필수다. 여러 명의 "진짜 다른 유저"를 흉내내고 싶다면 `setup()`에서 닉네임을 여러 개 돌려가며 dev-login을 여러 번 호출하도록 스크립트를 확장하면 된다(지금은 단순화를 위해 토큰 1개를 모든 VU가 공유).
