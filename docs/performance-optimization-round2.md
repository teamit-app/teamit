# 성능 최적화 2라운드 — 모니터링 (Actuator + Micrometer + CloudWatch)

1라운드(gzip/메모리 튜닝/React Query)는 "안 버벅이게" 만드는 변경이었고, 이번 라운드는 그게 **실제로 얼마나 효과가 있었는지 수치로 확인**하기 위한 계측 도입이다. 별도 Grafana/Prometheus 컨테이너는 t3.small(2GB)에 메모리 부담이 커서 배제하고, 이미 쓰고 있는 AWS 인프라에 맞춰 CloudWatch로 지표를 보내는 방식을 선택했다.

## 변경 사항

### 1. 의존성 (`apps/server/build.gradle`)
```gradle
implementation 'org.springframework.boot:spring-boot-starter-actuator'
implementation 'io.micrometer:micrometer-registry-cloudwatch2'
```
Actuator+Micrometer는 추가 코드 없이도 다음을 자동으로 계측한다:
- `http.server.requests` — 엔드포인트별 응답시간(카운트, 합계, p50/p95/p99)
- `jvm.memory.used/max`, `jvm.gc.*` — JVM 메모리·GC
- `process.cpu.usage`, `system.cpu.usage` — CPU
- `hikaricp.connections.*` — DB 커넥션 풀 사용량 (1라운드에서 만든 풀 설정의 실제 여유를 확인 가능)

### 2. management 포트 분리 (`application.yml`)
```yaml
management:
  server:
    port: 8081
  endpoints:
    web:
      exposure:
        include: health, metrics
  endpoint:
    health:
      show-details: never
  metrics:
    distribution:
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
      percentiles-histogram:
        http.server.requests: true
  cloudwatch:
    metrics:
      export:
        enabled: true
        namespace: teamit
        step: 1m
        batch-size: 20
```
**왜 포트를 분리했나:** 액추에이터 엔드포인트는 서비스 내부 상태(메모리, DB 커넥션 등)를 노출하므로 외부에 열어두면 안 된다. `SecurityConfig`에 예외를 추가하는 대신(→ `permitAll` 목록이 늘어나고 실수로 다른 경로까지 열릴 위험), **아예 nginx가 프록시하지 않는 별도 포트(8081)로 분리**했다. 이렇게 하면 인증 로직을 전혀 안 건드리고도 네트워크 단에서 확실히 차단된다.

### 3. docker-compose (`apps/server/docker-compose.yml`)
```yaml
app:
  ports:
    - "8080:8080"
    - "127.0.0.1:8081:8081"   # EC2 내부에서만 접근 가능, 인터넷/nginx 어디서도 도달 불가
  environment:
    AWS_REGION: ${AWS_REGION:-ap-northeast-2}
```
`127.0.0.1:8081:8081`로 바인딩했기 때문에 EC2 인스턴스 안에서 `curl localhost:8081/actuator/health`는 되지만, 외부에서는 포트 자체가 안 열려 있다.

### 4. CloudWatch 인증 — 액세스키 없이 IAM 역할 사용
자격증명을 `.env`/코드에 하드코딩하지 않고, **EC2 인스턴스에 IAM 역할을 붙여서** AWS SDK가 자동으로 임시 자격증명을 받아가게 한다. 이 부분은 AWS 콘솔 작업이 필요해서 아래에 별도 정리.

## IAM 역할 설정 (AWS 콘솔에서 직접 진행)

### 1) IAM 정책 생성
IAM 콘솔 → 정책 → 정책 생성 → JSON 탭에 아래 입력:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "cloudwatch:PutMetricData",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "cloudwatch:namespace": "teamit"
        }
      }
    }
  ]
}
```
`cloudwatch:namespace` 조건으로 "teamit" 네임스페이스에만 쓸 수 있게 최소 권한으로 제한했다. 정책 이름은 예: `teamit-cloudwatch-put-metrics`.

### 2) IAM 역할 생성
IAM 콘솔 → 역할 → 역할 생성 → 신뢰할 수 있는 엔터티: **AWS 서비스** → 사용 사례: **EC2** → 위에서 만든 정책 연결 → 역할 이름 예: `teamit-ec2-role`

### 3) 실행 중인 EC2 인스턴스에 역할 연결
EC2 콘솔 → 인스턴스 선택 → 작업(Actions) → 보안(Security) → **IAM 역할 수정** → `teamit-ec2-role` 선택 → 업데이트
- 재부팅 불필요, 즉시 적용된다.
- 인스턴스에 이미 다른 역할이 붙어있다면 교체가 아니라 정책을 추가하는 방향으로 조정할 것.

### 4) 메타데이터 홉 제한(hop limit) 2로 변경 — 중요, 놓치기 쉬움
앱이 Docker 컨테이너 안에서 실행되기 때문에, EC2 메타데이터 서비스(IMDSv2)까지 네트워크상 2홉을 거친다. 기본값(1홉)이면 컨테이너 안에서 IAM 역할 자격증명을 못 가져와서 CloudWatch 전송이 조용히 실패한다.

EC2 콘솔 → 인스턴스 선택 → 작업 → 인스턴스 설정 → **인스턴스 메타데이터 수정** → "메타데이터 응답 홉 제한"을 **2**로 변경 → 저장

### 5) 리전 확인
`.env`의 `AWS_REGION`이 실제 EC2가 있는 리전과 일치하는지 확인 (서울 리전이면 `ap-northeast-2`).

## 검증 방법
1. 배포 후 EC2에 SSH 접속 → `curl localhost:8081/actuator/health` → `{"status":"UP"}` 확인
2. 트래픽이 좀 쌓인 뒤(수 분), AWS 콘솔 → CloudWatch → 지표(Metrics) → 사용자 지정 네임스페이스에서 **teamit** 확인 → `http.server.requests` 등 지표가 쌓이는지 확인
3. 안 쌓인다면 다음 순서로 확인: ① IAM 역할이 인스턴스에 실제로 붙었는지 ② 메타데이터 홉 제한이 2인지 ③ 컨테이너 안에서 `curl -H "X-aws-ec2-metadata-token: $(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")" http://169.254.169.254/latest/meta-data/iam/security-credentials/`로 자격증명이 실제로 보이는지

## 다음 단계
- CloudWatch에 지표가 쌓이기 시작하면, `docs/performance-optimization-round1.md`에 미뤄뒀던 실측치(응답시간 p50/p95, gzip 적용 전후 등)를 채워 넣는다.
- 3라운드(N+1 쿼리 수정 + Redis 캐싱) 진행 후에도 같은 지표로 효과를 비교할 수 있다.
