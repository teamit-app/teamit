# 성능 최적화 3라운드 — N+1 쿼리 수정 + Redis 캐싱

2라운드(모니터링)까지 끝난 뒤 백엔드 자체의 쿼리 효율을 올리는 작업. **N+1 수정을 먼저 하고 Redis 캐싱을 나중에** 넣었다 — 캐시 미스(TTL 만료 직후, 콜드스타트, 관리자 CRUD 직후)에도 응답이 빨라야 하고, Redis를 먼저 넣으면 "느린 쿼리를 캐시로 가리는" 임시방편이 되기 때문이다.

## A. N+1 쿼리 수정

`User`/`Post`/`Contest` 엔티티에는 `@OneToMany` 컬렉션이 없다. 실제 문제는 컬렉션 매핑이 아니라 **리스트를 순회하며 아이템마다 리포지토리를 호출하는 서비스 코드**였다. `UserService`에 이미 있던 배치조회+Map 패턴(`findByUserIdIn` 등)을 그대로 재사용해서 고쳤다.

측정 도구로 `application-local.yml`에 `hibernate.generate_statistics`(+ `logging.level.org.hibernate.stat: debug`)를 추가했다. 운영에는 켜지 않는다 — 통계 수집 자체에 오버헤드가 있고, 2라운드에서 이미 Actuator/CloudWatch로 응답시간을 보고 있어서 쿼리 횟수 디버깅은 로컬 확인으로 충분하기 때문이다.

### 수정한 지점
- **`PostService.buildListItem` → `buildListItems`** (`getPostsByContest`/`getMyPosts`): 게시글 1건당 스킬/좋아요·댓글·지원자 수/공모전/채팅방 인원/모집자 지역 라벨까지 6~7개 쿼리를 날리던 것을 postIds 기준 배치 조회로 교체.
- **`ChatService.getChatRooms`**: 채팅방 1건당 6~7개 쿼리 + `buildGroupChatRoomResponse`와 `getTeamMembers`가 같은 방의 멤버를 중복 조회하던 문제를 배치 조회(Map)로 해소.
- **`PostService.averageRatingOf` → `averageRatingsOf`**: `getCandidates`/`getAllCandidates`/`getApplicants`에서 후보자 1명당 별점을 개별 조회하던 것을 배치화 (바로 옆 education/skill 배치조회와 동일한 패턴인데 별점만 놓쳤던 부분).
- **`PostService.buildLikedPost`**: `getLikedPosts`에서 `heart.getPost()`(LAZY 프록시)의 실제 컬럼을 읽어 하트 건당 지연로딩 쿼리가 발생하던 걸, postId만 뽑아 배치 로드하도록 수정.

### 의도적으로 범위에서 뺀 것
`ChatService`의 `lastMessage`/`unreadCount` 계산은 방마다 `joinedAt` 기준이 달라 단순 IN절 그룹핑이 안 되고, 인덱스 기반 단건 쿼리라 비용이 작아 이번 라운드에서는 그대로 뒀다.

## B. Redis 캐싱

### 캐싱 대상 (전부 비개인화 공개 DTO)

| 캐시 이름 | 메서드 | TTL |
|---|---|---|
| `contestsPopular` | `ContestService.getPopularContests()` | 30분 |
| `contestsList` | `ContestService.getContestList(...)` | 10분 |
| `contestsDetail` | `ContestService.getContestDetail(Long)` | 1시간 |
| `userPool` | `UserService.getUserPool(...)` | 5분 |

네 메서드 모두 JPA 엔티티가 아닌 별도 DTO를 반환해서(`.from()`/`.builder()`로 필드를 즉시 꺼내 조립) 지연로딩 프록시가 캐시에 들어갈 위험이 없다. 무효화는 `ContestService`의 `createContest`/`updateContest`/`deleteContest`(공모전 캐시), `UserService.setMatchingActive`와 `ContestService.registerParticipant`(내부에서 매칭 활성화를 바꾸므로 `userPool` 캐시도 같이 무효화)에 걸었다.

### 왜 이렇게 구성했나

- **SecurityConfig를 안 건드림**: 2라운드에서 액추에이터를 위해 만든 내부 전용 관리 포트(8081)처럼, 캐시 자체는 인증 로직과 무관하다. `@Cacheable`은 서비스 레이어에만 있고 별도 HTTP 엔드포인트를 노출하지 않으므로 보안 설정 변경이 필요 없었다.
- **직렬화**: `GenericJackson2JsonRedisSerializer`에 `activateDefaultTyping`을 걸되, `com.teamit.server` 패키지로 제한한 `BasicPolymorphicTypeValidator`를 써서 임의 클래스 역직렬화(가젯 공격) 위험을 줄였다. `new ObjectMapper()`를 새로 만들지 않고 스프링이 자동 구성한 기존 빈을 `.copy()`해서 재사용해 `LocalDate` 등 날짜 직렬화가 깨지지 않게 했다.
  - 참고: `GenericJackson2JsonRedisSerializer`는 이번에 확인해보니 spring-data-redis 4.0.5 기준 제거 예정(deprecated)이었다. Jackson 3 기반 대체(`GenericJacksonJsonRedisSerializer`)가 있지만 프로젝트 전체가 아직 Jackson 2를 쓰고 있어서, 이번 라운드는 동작하는 기존 방식으로 두고 Jackson 3 전환 시점에 같이 옮기기로 했다.
- **Redis 장애가 서비스 장애로 번지면 안 됨**: 캐시는 최적화이지 데이터 소스가 아니다. `CacheErrorHandler`(`CacheConfig`)를 구현해서 캐시 읽기/쓰기/삭제 실패는 로깅만 하고 삼켜서 원본 DB 조회로 자연스럽게 폴백하게 했다. 로컬에서 Redis 컨테이너 없이도 앱이 정상 기동/응답하는 걸로 확인.
- **dDay/isNew는 캐시 시점에 고정됨**: 응답 DTO가 생성 시점의 `LocalDate.now()` 기준으로 값을 계산해서 담기 때문에, 캐시된 동안(최대 TTL만큼)은 날짜가 지나도 값이 그대로다. TTL이 10분~1시간이라 실사용 체감은 없지만, 자정 근처에 TTL이 걸치면 D-day가 하루 어긋나 보일 수 있는 트레이드오프를 인지하고 진행했다.

### docker-compose 메모리 예산
```
mysql 500m + app 850m + redis 220m = 1570m / 2048m(t3.small)
```
Redis는 순수 캐시 용도라 영속성이 필요 없어 RDB 스냅샷/AOF를 모두 껐다(`--save "" --appendonly no`) — 재시작 시 캐시가 비는 건 정상이고 DB에서 다시 채워진다.

**실배포 후 `docker stats`로 확인해보니 mysql이 트래픽이 거의 없는데도 400m 한도의 97%(388MiB)를 쓰고 있었다.** MySQL 8.0은 기본적으로 Performance Schema(내부 진단용 계측)가 켜져 있는데, 이게 트래픽과 무관하게 100MB+를 잡아먹는 경우가 흔하다. 앱 레벨 모니터링(Actuator/CloudWatch)이 이미 있어 DB 내부 계측까지는 필요 없어서 `--performance_schema=OFF`로 껐다. 동시에 app은 1000m 중 432MiB(43%)만 쓰고 있는 걸 확인해서, 그 여유를 mysql 쪽으로 옮겼다(mysql 400→500m, app 1000→850m). 베타 트래픽이 실제로 붙으면 다시 `docker stats`로 확인 필요.

**`maxmemory` 필수.** `mem_limit`(도커가 "넘으면 컨테이너를 죽인다"는 한도)과 Redis `maxmemory`(Redis 자신에게 "여기까지만 써라"라고 알려주는 설정)는 별개다. `maxmemory`가 없으면 Redis는 자기 한도를 모른 채 계속 쌓다가 `mem_limit`을 넘는 순간 OOM Kill로 컨테이너 자체가 죽는다. 그래서 `command`에 `--maxmemory 180mb --maxmemory-policy allkeys-lru`를 반드시 같이 넣었다 — `mem_limit`(220m)보다 40m 낮게 잡아서 Redis 프로세스 자체 오버헤드(커넥션 버퍼, 메모리 파편화 등) 여유분을 뒀다. `allkeys-lru`는 한도에 도달하면 "죽는" 대신 오래 안 쓴 키부터 자동으로 버리는 정책이라 순수 캐시 용도에 맞다.

**캐시 무효화는 파라미터 조합 전부를 지운다.** `contestsList`/`userPool`은 필터·페이지 조합마다 캐시 키가 따로 생기는 메서드라, 특정 키 하나만 지우면 나머지 조합엔 옛 데이터가 남는다. 그래서 `@CacheEvict`에 전부 `allEntries = true`를 걸었다(`ContestService.createContest/updateContest/deleteContest/registerParticipant`, `UserService.setMatchingActive`).

### 캐시 히트율 측정
`application.yml`에 `spring.cache.redis.enable-statistics: true`를 추가했다. 이러면 Micrometer가 `cache.gets`(태그 `result=hit|miss`) 지표를 자동으로 노출하고, 2라운드에서 이미 만든 CloudWatch 파이프라인에 그대로 실려간다 — 추가 코드 없이 "캐싱을 적용했다"가 아니라 "히트율 몇 %"까지 확인할 수 있다.

## 검증
- N+1 수정 각 커밋: 로컬에 리스트가 쌓이도록 시딩 후 수정 전/후 Hibernate 세션 통계로 쿼리 수 비교, `gradlew compileJava`/`compileTestJava`/도메인 유닛 테스트 통과 확인
- Redis: `CacheErrorHandler` 덕분에 Redis 없이도 앱이 정상 동작하는 것 확인. 실제 배포 후에는 EC2에서 `docker stats`로 redis 컨테이너 메모리가 180mb 근처에서 유지되는지(그 이상 안 올라가는지), 관리자 CRUD 후 목록에 즉시 반영되는지(evict 확인) 점검 필요
- 실측 응답시간(p50/p95)과 캐시 히트율은 2라운드에서 만든 CloudWatch 지표로 배포 후 확인 예정
