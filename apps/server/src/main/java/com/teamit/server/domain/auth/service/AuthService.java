package com.teamit.server.domain.auth.service;

import com.teamit.server.domain.auth.dto.*;
import com.teamit.server.domain.auth.entity.RefreshToken;
import com.teamit.server.domain.auth.repository.RefreshTokenRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import com.teamit.server.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final KakaoOAuthService kakaoOAuthService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    // 웹 OAuth 세션 캐시 (sessionId → 로그인 결과, 5분 TTL)
    private final ConcurrentHashMap<String, KakaoLoginResponse> sessionCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> sessionExpiry = new ConcurrentHashMap<>();

    // ──────────────────────────────────────────────────────────────
    // 카카오 로그인 / 회원가입
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public KakaoLoginResponse kakaoLogin(String kakaoAccessToken) {
        KakaoUserInfo kakaoUserInfo = kakaoOAuthService.getUserInfo(kakaoAccessToken);
        Long kakaoId = kakaoUserInfo.getId();

        User user = userRepository.findByKakaoId(kakaoId).orElse(null);

        if (user == null) {
            user = userRepository.save(User.builder()
                    .kakaoId(kakaoId)
                    .nickname(kakaoUserInfo.getNickname())
                    .profileImageUrl(kakaoUserInfo.getProfileImageUrl())
                    .isMatchingActive(true)
                    .build());
        }

        // 온보딩(기본정보 입력)을 완료했는지 체크 — 지역/학력은 온보딩과 무관하게 마이페이지에서 별도 입력
        boolean needsOnboarding = user.getName() == null;

        String accessToken = jwtTokenProvider.createAccessToken(user.getId());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());
        saveOrRotateRefreshToken(user.getId(), refreshToken);

        return KakaoLoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .isNewUser(needsOnboarding)
                .userId(user.getId())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // Access Token 재발급 (Refresh Token Rotation 적용)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public ReissueResponse reissue(String requestRefreshToken) {
        if (!jwtTokenProvider.validate(requestRefreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다");
        }

        Long userId = jwtTokenProvider.getUserId(requestRefreshToken);

        RefreshToken stored = refreshTokenRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("리프레시 토큰을 찾을 수 없습니다"));

        if (!stored.getToken().equals(requestRefreshToken)) {
            throw new IllegalArgumentException("리프레시 토큰이 일치하지 않습니다");
        }

        String newAccessToken = jwtTokenProvider.createAccessToken(userId);
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);

        stored.rotate(newRefreshToken, expiryAt());

        return ReissueResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 로그아웃 — Refresh Token 삭제
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    // ──────────────────────────────────────────────────────────────
    // 회원 탈퇴 — Refresh Token + User 삭제
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void withdraw(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);
    }

    // ──────────────────────────────────────────────────────────────
    // 웹 OAuth 콜백용 — 인가 코드로 로그인 처리
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public KakaoLoginResponse kakaoWebCallback(String code, String redirectUri) {
        String kakaoAccessToken = kakaoOAuthService.exchangeCodeForToken(code, redirectUri);
        return kakaoLogin(kakaoAccessToken);
    }

    // 세션 저장 (폴링용)
    public void storeSession(String sessionId, KakaoLoginResponse response) {
        long expiry = System.currentTimeMillis() + 5 * 60 * 1000L;
        sessionCache.put(sessionId, response);
        sessionExpiry.put(sessionId, expiry);
        // 만료된 세션 정리
        long now = System.currentTimeMillis();
        sessionExpiry.entrySet().removeIf(e -> {
            if (e.getValue() < now) { sessionCache.remove(e.getKey()); return true; }
            return false;
        });
    }

    // 세션 조회 및 삭제 (폴링 성공 시 1회성 소비)
    public KakaoLoginResponse getAndRemoveSession(String sessionId) {
        Long expiry = sessionExpiry.get(sessionId);
        if (expiry == null || expiry < System.currentTimeMillis()) {
            sessionCache.remove(sessionId);
            sessionExpiry.remove(sessionId);
            return null;
        }
        sessionExpiry.remove(sessionId);
        return sessionCache.remove(sessionId);
    }

    private void saveOrRotateRefreshToken(Long userId, String token) {
        refreshTokenRepository.findByUserId(userId).ifPresentOrElse(
                rt -> rt.rotate(token, expiryAt()),
                () -> refreshTokenRepository.save(RefreshToken.builder()
                        .userId(userId)
                        .token(token)
                        .expiredAt(expiryAt())
                        .build())
        );
    }

    private LocalDateTime expiryAt() {
        return LocalDateTime.now().plusSeconds(refreshTokenExpiry / 1000);
    }
}
