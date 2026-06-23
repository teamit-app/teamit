# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

# API 호출 규칙 (반드시 준수)

## 인증 방식
서버는 JWT 기반 인증(@LoginUser)을 사용한다. 모든 API 호출은 `src/services/api.ts`의 `apiRequest()`를 통해 이루어지며, Authorization 헤더가 자동으로 주입된다.

## URL에 userId 절대 포함 금지
서버가 JWT에서 userId를 직접 읽으므로, URL path에 userId를 넣지 않는다.

```typescript
// 틀림
apiRequest(`/users/${userId}/contest-hearts`)
apiRequest(`/users/${userId}/hearts/${targetUserId}`)

// 맞음
apiRequest(`/users/contest-hearts`)
apiRequest(`/users/hearts/${targetUserId}`)
```

## 새 API 서비스 작성 시 체크리스트
1. `apiRequest(endpoint, options)`만 사용 — 직접 `fetch()` 사용 금지
2. endpoint에 userId 변수 포함 여부 확인 → 포함되어 있으면 제거
3. mock 라우트도 같은 경로로 `mockRouter.ts`에 추가
4. IS_MOCK 분기는 `api.ts`가 자동 처리하므로 서비스 파일에서 별도 처리 불필요

## mock 모드
`EXPO_PUBLIC_API_MODE=mock`일 때 실제 서버 호출 없이 `mockRouter.ts`의 더미 데이터가 반환된다.
새 엔드포인트 추가 시 `mockRouter.ts`의 `staticRoutes` 또는 `dynamicRoutes`에 대응하는 mock 데이터를 반드시 추가해야 한다.
