package com.teamit.server.domain.auth.controller;

import com.teamit.server.domain.auth.dto.*;
import com.teamit.server.domain.auth.service.AuthService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Tag(name = "Auth", description = "카카오 소셜 로그인 및 JWT 인증 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${kakao.client-id}")
    private String kakaoClientId;

    @Value("${kakao.redirect-uri}")
    private String kakaoRedirectUri;

    @Operation(summary = "카카오 로그인", description = "카카오 액세스 토큰으로 로그인합니다. 신규 회원이면 자동 가입됩니다.")
    @PostMapping("/kakao")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<KakaoLoginResponse> kakaoLogin(@RequestBody KakaoLoginRequest request) {
        KakaoLoginResponse response = authService.kakaoLogin(request.getKakaoAccessToken());
        String message = response.isNewUser() ? "회원가입 성공. 온보딩을 진행해주세요" : "로그인 성공";
        return ApiResponse.success(response, message);
    }

    @Operation(summary = "카카오 웹 로그인 시작 (Expo Go 개발용)", description = "브라우저를 열어 카카오 OAuth 인증을 시작합니다.")
    @GetMapping("/kakao/web")
    public void initiateKakaoWebLogin(
            @RequestParam String sessionId,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        String kakaoAuthUrl = "https://kauth.kakao.com/oauth/authorize"
                + "?response_type=code"
                + "&client_id=" + kakaoClientId
                + "&redirect_uri=" + URLEncoder.encode(kakaoRedirectUri, StandardCharsets.UTF_8)
                + "&state=" + sessionId;
        response.sendRedirect(kakaoAuthUrl);
    }

    @Operation(summary = "카카오 세션 조회 (폴링)", description = "로그인 완료 여부를 폴링합니다. 완료 시 토큰을 반환합니다.")
    @GetMapping("/kakao/session/{sessionId}")
    public ApiResponse<KakaoLoginResponse> getKakaoSession(@PathVariable String sessionId) {
        KakaoLoginResponse sessionResponse = authService.getAndRemoveSession(sessionId);
        if (sessionResponse == null) {
            throw new IllegalArgumentException("세션을 찾을 수 없습니다");
        }
        return ApiResponse.success(sessionResponse, "로그인 정보를 가져왔습니다");
    }

    @Operation(summary = "토큰 재발급", description = "Refresh Token으로 새 Access/Refresh Token을 발급합니다.")
    @PostMapping("/reissue")
    public ApiResponse<ReissueResponse> reissue(@RequestBody ReissueRequest request) {
        ReissueResponse response = authService.reissue(request.getRefreshToken());
        return ApiResponse.success(response, "토큰이 재발급되었습니다");
    }

    @Operation(summary = "로그아웃", description = "Refresh Token을 무효화합니다.")
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@LoginUser CustomUserDetails userDetails) {
        authService.logout(userDetails.getUserId());
        return ApiResponse.success(null, "로그아웃되었습니다");
    }

    @Operation(summary = "회원 탈퇴", description = "사용자 계정을 삭제합니다.")
    @DeleteMapping("/withdraw")
    public ApiResponse<Void> withdraw(@LoginUser CustomUserDetails userDetails) {
        authService.withdraw(userDetails.getUserId());
        return ApiResponse.success(null, "회원 탈퇴가 완료되었습니다");
    }

}
