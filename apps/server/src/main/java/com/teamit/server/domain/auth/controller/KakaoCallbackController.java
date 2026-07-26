package com.teamit.server.domain.auth.controller;

import com.teamit.server.domain.auth.dto.KakaoLoginResponse;
import com.teamit.server.domain.auth.service.AuthService;
import com.teamit.server.domain.auth.service.KakaoOAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/oauth/kakao")
@RequiredArgsConstructor
public class KakaoCallbackController {

    private final KakaoOAuthService kakaoOAuthService;
    private final AuthService authService;

    @Value("${kakao.redirect-uri}")
    private String kakaoRedirectUri;

    @GetMapping("/callback")
    public ResponseEntity<String> handleCallback(
            @RequestParam String code,
            @RequestParam String state) {

        try {
            log.info("[카카오 콜백] sessionId={}, code 수신 완료", state);

            String kakaoAccessToken = kakaoOAuthService.exchangeCodeForToken(code, kakaoRedirectUri);
            log.info("[카카오 콜백] 액세스 토큰 교환 성공");

            KakaoLoginResponse loginResponse = authService.kakaoLogin(kakaoAccessToken);
            log.info("[카카오 콜백] 로그인 처리 완료, userId={}", loginResponse.getUserId());

            authService.storeSession(state, loginResponse);
            log.info("[카카오 콜백] 세션 저장 완료");

            // 앱(로그인 화면)이 폴링으로 로그인 완료를 감지하면 이 창을 직접 닫아준다.
            // 다만 그 폴링이 어떤 이유로든 못 미치는 경우를 대비해, 이 페이지 스스로도
            // 잠시 후 닫기를 시도하고, 그마저 브라우저 정책상 막히면 안내 문구를 보여준다
            // (이전엔 완전히 빈 화면만 남아 로그인 실패로 오해하게 만드는 버그가 있었음).
            String html = "<html><head><meta charset='UTF-8'>"
                    + "<style>body{margin:0;background:#fff;display:flex;align-items:center;justify-content:center;"
                    + "height:100vh;font-family:sans-serif;color:#888;font-size:14px}</style></head>"
                    + "<body><span id='msg'></span>"
                    + "<script>"
                    + "setTimeout(function(){"
                    + "  try { window.close(); } catch (e) {}"
                    + "  document.getElementById('msg').textContent = '로그인이 완료됐어요. 이 창을 닫고 앱으로 돌아가주세요.';"
                    + "}, 1500);"
                    + "</script></body></html>";

            return ResponseEntity.ok()
                    .contentType(new MediaType("text", "html", java.nio.charset.StandardCharsets.UTF_8))
                    .body(html);

        } catch (Exception e) {
            log.error("[카카오 콜백] 처리 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .contentType(new MediaType("text", "html", java.nio.charset.StandardCharsets.UTF_8))
                    .body("<html><body><h2>로그인 처리 중 오류가 발생했습니다</h2><p>" + e.getMessage() + "</p></body></html>");
        }
    }
}
