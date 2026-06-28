package com.teamit.server.domain.contest.controller;

import com.teamit.server.domain.contest.dto.ContestDetailResponse;
import com.teamit.server.domain.contest.dto.ContestPageResponse;
import com.teamit.server.domain.contest.dto.PopularContestListResponse;
import com.teamit.server.domain.contest.entity.ContestCategory;
import com.teamit.server.domain.contest.entity.ContestStatus;
import com.teamit.server.domain.contest.service.ContestService;
import com.teamit.server.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Contest", description = "공모전 API")
@RestController
@RequestMapping("/api/v1/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestService contestService;

    @Operation(summary = "공모전 상세 조회")
    @GetMapping("/{contestId}")
    public ApiResponse<ContestDetailResponse> getContestDetail(@PathVariable Long contestId) {
        return ApiResponse.success(contestService.getContestById(contestId), "공모전 상세 조회 성공");
    }

    @Operation(summary = "금주의 인기 공모전 목록", description = "진행중인 공모전을 최신순으로 조회합니다.")
    @GetMapping("/popular")
    public ApiResponse<PopularContestListResponse> getPopularContests() {
        PopularContestListResponse response = contestService.getPopularContests();
        return ApiResponse.success(response, "인기 공모전 목록 조회 성공");
    }

    @Operation(summary = "공모전 목록 조회", description = "카테고리, 상태, 키워드(공모전명/주최기관/카테고리) 필터로 공모전을 조회합니다.")
    @GetMapping
    public ApiResponse<ContestPageResponse> getContestList(
            @RequestParam(required = false) ContestCategory category,
            @RequestParam(required = false) ContestStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        ContestPageResponse response = contestService.getContestList(category, status, keyword, page, size);
        return ApiResponse.success(response, "공모전 목록 조회 성공");
    }
}
