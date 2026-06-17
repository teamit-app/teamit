package com.teamit.server.domain.contest.controller;

import com.teamit.server.domain.contest.dto.PopularContestListResponse;
import com.teamit.server.domain.contest.service.ContestService;
import com.teamit.server.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Contest", description = "공모전 API")
@RestController
@RequestMapping("/api/v1/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestService contestService;

    @Operation(summary = "금주의 인기 공모전 목록", description = "진행중인 공모전을 최신순으로 조회합니다.")
    @GetMapping("/popular")
    public ApiResponse<PopularContestListResponse> getPopularContests() {
        PopularContestListResponse response = contestService.getPopularContests();
        return ApiResponse.success(response, "인기 공모전 목록 조회 성공");
    }
}
