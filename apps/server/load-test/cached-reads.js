// 3라운드에서 Redis 캐싱을 적용한 4개 공개 조회 API(인기 공모전/공모전 목록/공모전 상세/인재풀)에
// 부하를 걸어서, 캐싱+N+1 수정 이후 t3.small이 목표 동시 사용자 수(베타 50명)를 버티는지 확인한다.
//
// 실행:
//   로컬(docker-compose, local 프로필): k6 run cached-reads.js -e BASE_URL=http://localhost:8080/api/v1
//   배포된 서버(prod):                  k6 run cached-reads.js -e BASE_URL=https://api.teamit.kr/api/v1 -e AUTH_TOKEN=실제로그인한액세스토큰
//
// prod에는 로컬 전용 dev-login이 없어서(SecurityConfig 규칙상 의도된 것 — 정식 카카오 로그인만 허용)
// AUTH_TOKEN을 직접 넘겨야 한다. 자세한 건 README.md 참고.

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

// 시나리오 강도는 여기서만 바꾸면 된다 — 처음 돌릴 땐 TARGET_VUS를 낮게 잡고 점점 올리는 걸 권장.
const TARGET_VUS = Number(__ENV.TARGET_VUS || 50);

export const options = {
  scenarios: {
    cached_reads: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: Math.min(20, TARGET_VUS) },
        { duration: '30s', target: TARGET_VUS },
        { duration: '1m', target: TARGET_VUS },
        { duration: '20s', target: 0 },
      ],
    },
  },
  thresholds: {
    // 목표치일 뿐 실패해도 스크립트가 죽지는 않는다 — 결과 리포트에서 빨간 줄로 표시됨
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  if (AUTH_TOKEN) return { token: AUTH_TOKEN };

  // local 프로필에서만 존재하는 dev-login으로 테스트용 유저를 만들고 토큰을 받는다.
  const res = http.post(
    `${BASE_URL}/auth/dev/login`,
    JSON.stringify({ nickname: 'loadtest-user' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const ok = check(res, { 'dev-login 200': (r) => r.status === 200 });
  if (!ok) {
    throw new Error(
      `dev-login 실패(status=${res.status}). BASE_URL이 local 프로필로 뜬 서버가 맞는지, ` +
      `또는 prod를 테스트하려는 거라면 -e AUTH_TOKEN=... 을 넘겼는지 확인하세요.`,
    );
  }
  const body = JSON.parse(res.body);
  return { token: body.data.accessToken };
}

export default function (data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };
  const pick = Math.random();

  if (pick < 0.4) {
    // 홈 화면 — 가장 자주 호출될 것으로 예상되는 캐시(contestsPopular)
    const res = http.get(`${BASE_URL}/contests/popular`, params);
    check(res, { '인기 공모전 200': (r) => r.status === 200 });
  } else if (pick < 0.7) {
    // 탐색 탭 — 페이지별로 캐시 키가 나뉘는 contestsList
    const page = Math.floor(Math.random() * 3);
    const res = http.get(`${BASE_URL}/contests?page=${page}&size=20`, params);
    check(res, { '공모전 목록 200': (r) => r.status === 200 });
  } else if (pick < 0.9) {
    // 공모전 상세(contestsDetail) — 실제 존재하는 id 범위로 맞춰서 돌려야 정확한 캐시 히트가 남
    const contestId = Number(__ENV.SAMPLE_CONTEST_ID || 1);
    const res = http.get(`${BASE_URL}/contests/${contestId}`, params);
    check(res, { '공모전 상세 200': (r) => r.status === 200 });
  } else {
    // 인재풀(userPool)
    const res = http.get(`${BASE_URL}/users?page=0&size=20`, params);
    check(res, { '인재풀 200': (r) => r.status === 200 });
  }

  sleep(1); // 실제 유저의 "화면 보는 시간" 흉내 — 초당 요청이 VU 수만큼 무한정 쏟아지지 않게 함
}
