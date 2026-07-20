# API 설계 규칙 (반드시 준수)

## 인증 방식
모든 인증이 필요한 엔드포인트는 `@LoginUser CustomUserDetails userDetails`로 userId를 받는다.
URL path에 userId를 받지 않는다.

```java
// 틀림
@GetMapping("/users/{userId}/contest-hearts")
public ApiResponse<?> getHeartedContests(@PathVariable Long userId) { ... }

// 맞음
@GetMapping("/users/contest-hearts")
public ApiResponse<?> getHeartedContests(@LoginUser CustomUserDetails userDetails) {
    // userDetails.getUserId() 로 userId 사용
}
```

## SecurityConfig 규칙
- 인증이 필요 없는 엔드포인트만 `permitAll()` 추가
- 나머지는 `anyRequest().authenticated()` 그대로 유지
- 현재 permitAll 목록: /swagger-ui/**, /v3/api-docs/**, /api/v1/auth/**, /oauth/kakao/callback

## 응답 형식
모든 응답은 `ApiResponse.success(data, message)`로 통일한다.
프론트엔드는 `{ success: true, data: {...}, message: "..." }` 형태를 기대한다.
