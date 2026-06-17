package com.teamit.server.domain.home.controller;

import com.teamit.server.domain.home.dto.MatchingStatusResponse;
import com.teamit.server.domain.home.service.HomeService;
import com.teamit.server.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Home", description = "홈 화면 API")
@RestController
@RequestMapping("/api/v1/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomeService homeService;

    @Operation(summary = "나의 실시간 매칭 현황", description = "받은 제안 수(PENDING 상태)와 지원한 팀 수를 반환합니다.")
    @GetMapping("/matching-status")
    public ApiResponse<MatchingStatusResponse> getMatchingStatus(
            @RequestParam Long userId) {
        MatchingStatusResponse response = homeService.getMatchingStatus(userId);
        return ApiResponse.success(response, "매칭 현황 조회 성공");
    }
}
