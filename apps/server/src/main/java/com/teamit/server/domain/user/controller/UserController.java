package com.teamit.server.domain.user.controller;

import com.teamit.server.domain.contest.dto.HeartedContestListResponse;
import com.teamit.server.domain.contest.service.ContestService;
import com.teamit.server.domain.user.dto.*;
import com.teamit.server.domain.user.service.UserService;
import com.teamit.server.global.response.ApiResponse;
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

    @Operation(summary = "온보딩 기본정보 저장", description = "닉네임, 이름, 성별, 생년월일을 저장합니다.")
    @PostMapping("/onboarding/basic")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OnboardingBasicResponse> saveBasicInfo(
            @RequestBody OnboardingBasicRequest request) {
        OnboardingBasicResponse response = userService.saveBasicInfo(request);
        return ApiResponse.success(response, "기본 정보가 저장되었습니다");
    }

    @Operation(summary = "인재풀 목록 조회", description = "스킬, 지역, 역할, 키워드(닉네임/스킬명) 필터로 인재풀을 조회합니다.")
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

    @Operation(summary = "인재풀 하트 추가", description = "관심 팀원으로 추가합니다.")
    @PostMapping("/{userId}/hearts/{targetUserId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> addHeart(
            @PathVariable Long userId,
            @PathVariable Long targetUserId) {
        userService.addHeart(userId, targetUserId);
        return ApiResponse.success(null, "관심 팀원으로 저장되었습니다");
    }

    @Operation(summary = "인재풀 하트 취소", description = "관심 팀원을 취소합니다.")
    @DeleteMapping("/{userId}/hearts/{targetUserId}")
    public ApiResponse<Void> removeHeart(
            @PathVariable Long userId,
            @PathVariable Long targetUserId) {
        userService.removeHeart(userId, targetUserId);
        return ApiResponse.success(null, "관심 팀원이 취소되었습니다");
    }

    @Operation(summary = "관심 팀원 목록 조회", description = "하트한 팀원 목록을 조회합니다.")
    @GetMapping("/{userId}/hearts")
    public ApiResponse<HeartedUserListResponse> getHeartedUsers(
            @PathVariable Long userId) {
        HeartedUserListResponse response = userService.getHeartedUsers(userId);
        return ApiResponse.success(response, "관심 팀원 목록 조회 성공");
    }

    @Operation(summary = "공모전 하트 추가", description = "관심 공모전으로 추가합니다.")
    @PostMapping("/{userId}/contest-hearts/{contestId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> addContestHeart(
            @PathVariable Long userId,
            @PathVariable Long contestId) {
        contestService.addContestHeart(userId, contestId);
        return ApiResponse.success(null, "관심 공모전으로 저장되었습니다");
    }

    @Operation(summary = "공모전 하트 취소", description = "관심 공모전을 취소합니다.")
    @DeleteMapping("/{userId}/contest-hearts/{contestId}")
    public ApiResponse<Void> removeContestHeart(
            @PathVariable Long userId,
            @PathVariable Long contestId) {
        contestService.removeContestHeart(userId, contestId);
        return ApiResponse.success(null, "관심 공모전이 취소되었습니다");
    }

    @Operation(summary = "관심 공모전 목록 조회", description = "하트한 공모전 목록을 조회합니다.")
    @GetMapping("/{userId}/contest-hearts")
    public ApiResponse<HeartedContestListResponse> getHeartedContests(
            @PathVariable Long userId) {
        HeartedContestListResponse response = contestService.getHeartedContests(userId);
        return ApiResponse.success(response, "관심 공모전 목록 조회 성공");
    }
}
