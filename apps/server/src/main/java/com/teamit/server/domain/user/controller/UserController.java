package com.teamit.server.domain.user.controller;

import com.teamit.server.domain.contest.dto.HeartedContestListResponse;
import com.teamit.server.domain.contest.service.ContestService;
import com.teamit.server.domain.user.dto.*;
import com.teamit.server.domain.user.service.UserService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "사용자 온보딩 및 프로필 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ContestService contestService;

    @Operation(summary = "내 프로필 조회 (온보딩 완료 여부 포함)")
    @GetMapping("/me")
    public ApiResponse<UserMeResponse> getMe(@LoginUser CustomUserDetails userDetails) {
        UserMeResponse response = userService.getMe(userDetails.getUserId());
        return ApiResponse.success(response, "내 프로필 조회 성공");
    }

    @Operation(summary = "온보딩 기본정보 저장")
    @PostMapping("/onboarding/basic")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OnboardingBasicResponse> saveBasicInfo(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody OnboardingBasicRequest request) {
        OnboardingBasicResponse response = userService.saveBasicInfo(userDetails.getUserId(), request);
        return ApiResponse.success(response, "기본 정보가 저장되었습니다");
    }

    @Operation(summary = "인재풀 목록 조회")
    @GetMapping
    public ApiResponse<UserPoolPageResponse> getUserPool(
            @RequestParam(required = false) Long skillId,
            @RequestParam(required = false) String sido,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UserPoolPageResponse response = userService.getUserPool(skillId, sido, role, keyword, page, size);
        return ApiResponse.success(response, "인재풀 조회 성공");
    }

    @Operation(summary = "인재풀 하트 추가")
    @PostMapping("/hearts/{targetUserId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> addHeart(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long targetUserId) {
        userService.addHeart(userDetails.getUserId(), targetUserId);
        return ApiResponse.success(null, "관심 팀원으로 저장되었습니다");
    }

    @Operation(summary = "인재풀 하트 취소")
    @DeleteMapping("/hearts/{targetUserId}")
    public ApiResponse<Void> removeHeart(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long targetUserId) {
        userService.removeHeart(userDetails.getUserId(), targetUserId);
        return ApiResponse.success(null, "관심 팀원이 취소되었습니다");
    }

    @Operation(summary = "관심 팀원 목록 조회")
    @GetMapping("/hearts")
    public ApiResponse<HeartedUserListResponse> getHeartedUsers(
            @LoginUser CustomUserDetails userDetails) {
        HeartedUserListResponse response = userService.getHeartedUsers(userDetails.getUserId());
        return ApiResponse.success(response, "관심 팀원 목록 조회 성공");
    }

    @Operation(summary = "공모전 하트 추가")
    @PostMapping("/contest-hearts/{contestId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> addContestHeart(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long contestId) {
        contestService.addContestHeart(userDetails.getUserId(), contestId);
        return ApiResponse.success(null, "관심 공모전으로 저장되었습니다");
    }

    @Operation(summary = "공모전 하트 취소")
    @DeleteMapping("/contest-hearts/{contestId}")
    public ApiResponse<Void> removeContestHeart(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long contestId) {
        contestService.removeContestHeart(userDetails.getUserId(), contestId);
        return ApiResponse.success(null, "관심 공모전이 취소되었습니다");
    }

    @Operation(summary = "관심 공모전 목록 조회")
    @GetMapping("/contest-hearts")
    public ApiResponse<HeartedContestListResponse> getHeartedContests(
            @LoginUser CustomUserDetails userDetails) {
        HeartedContestListResponse response = contestService.getHeartedContests(userDetails.getUserId());
        return ApiResponse.success(response, "관심 공모전 목록 조회 성공");
    }
}
