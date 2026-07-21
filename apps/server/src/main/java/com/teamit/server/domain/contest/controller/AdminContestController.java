package com.teamit.server.domain.contest.controller;

import com.teamit.server.domain.contest.dto.ContestDetailResponse;
import com.teamit.server.domain.contest.dto.ContestRequest;
import com.teamit.server.domain.contest.service.ContestService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.AdminAuthorizer;
import com.teamit.server.global.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Tag(name = "Admin", description = "관리자 전용 API (users.role = ADMIN인 유저만 허용)")
@RestController
@RequestMapping("/api/v1/admin/contests")
@RequiredArgsConstructor
public class AdminContestController {

    private final ContestService contestService;
    private final AdminAuthorizer adminAuthorizer;

    @Operation(summary = "공모전 전체 목록 조회 (관리자)")
    @GetMapping
    public ApiResponse<List<ContestDetailResponse>> getAllContests(@LoginUser CustomUserDetails userDetails) {
        adminAuthorizer.check(userDetails.getUserId());
        return ApiResponse.success(contestService.getAllContestsForAdmin(), "공모전 목록 조회 성공");
    }

    @Operation(summary = "공모전 포스터 이미지 업로드")
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> uploadPosterImage(
            @LoginUser CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        adminAuthorizer.check(userDetails.getUserId());
        String url = contestService.uploadPosterImage(file);
        return ApiResponse.success(Map.of("imageUrl", url), "포스터 이미지가 업로드되었습니다");
    }

    @Operation(summary = "공모전 등록")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ContestDetailResponse> createContest(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody ContestRequest request) {
        adminAuthorizer.check(userDetails.getUserId());
        return ApiResponse.success(contestService.createContest(request), "공모전이 등록되었습니다");
    }

    @Operation(summary = "공모전 수정")
    @PatchMapping("/{contestId}")
    public ApiResponse<ContestDetailResponse> updateContest(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long contestId,
            @RequestBody ContestRequest request) {
        adminAuthorizer.check(userDetails.getUserId());
        return ApiResponse.success(contestService.updateContest(contestId, request), "공모전이 수정되었습니다");
    }

    @Operation(summary = "공모전 삭제")
    @DeleteMapping("/{contestId}")
    public ApiResponse<Void> deleteContest(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long contestId) {
        adminAuthorizer.check(userDetails.getUserId());
        contestService.deleteContest(contestId);
        return ApiResponse.success(null, "공모전이 삭제되었습니다");
    }
}
