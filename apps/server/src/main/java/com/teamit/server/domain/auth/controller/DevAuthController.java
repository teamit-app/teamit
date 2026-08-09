package com.teamit.server.domain.auth.controller;

import com.teamit.server.domain.auth.dto.KakaoLoginResponse;
import com.teamit.server.domain.auth.entity.RefreshToken;
import com.teamit.server.domain.auth.repository.RefreshTokenRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import com.teamit.server.global.jwt.JwtTokenProvider;
import com.teamit.server.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * 로컬 개발 전용 인증 컨트롤러.
 * @Profile("local") 로 프로덕션에서는 절대 활성화되지 않음.
 *
 * 사용 방법:
 *   POST /api/v1/auth/dev/login
 *   Body: { "nickname": "테스트A" }
 *   → 해당 닉네임의 유저를 찾거나 새로 생성하고 JWT를 발급합니다.
 */
@Tag(name = "DevAuth (로컬 전용)", description = "카카오 없이 JWT를 발급하는 로컬 개발용 엔드포인트")
@RestController
@RequestMapping("/api/v1/auth/dev")
@RequiredArgsConstructor
@Profile("local")
public class DevAuthController {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    @Operation(
        summary = "[로컬 전용] 닉네임으로 즉시 로그인",
        description = "닉네임으로 유저를 찾거나 새로 생성해 JWT를 발급합니다. 카카오 로그인 없이 테스트할 수 있습니다."
    )
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<KakaoLoginResponse> devLogin(@RequestBody DevLoginRequest request) {
        // 같은 닉네임의 유저가 있으면 재사용, 없으면 신규 생성
        boolean[] created = { false };
        User user = userRepository.findByNickname(request.nickname())
                .orElseGet(() -> {
                    created[0] = true;
                    return userRepository.save(User.builder()
                            .nickname(request.nickname())
                            .isMatchingActive(true)
                            .build());
                });

        String accessToken = jwtTokenProvider.createAccessToken(user.getId());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        // Refresh Token 저장 (기존 있으면 교체)
        refreshTokenRepository.findByUserId(user.getId()).ifPresentOrElse(
                rt -> rt.rotate(refreshToken, expiryAt()),
                () -> refreshTokenRepository.save(RefreshToken.builder()
                        .userId(user.getId())
                        .token(refreshToken)
                        .expiredAt(expiryAt())
                        .build())
        );

        return ApiResponse.success(
                KakaoLoginResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .isNewUser(created[0])
                        .userId(user.getId())
                        .build(),
                "[DEV] '" + user.getNickname() + "' (userId=" + user.getId() + ") 로그인 성공"
        );
    }

    private LocalDateTime expiryAt() {
        return LocalDateTime.now().plusSeconds(refreshTokenExpiry / 1000);
    }

    public record DevLoginRequest(String nickname) {}
}
