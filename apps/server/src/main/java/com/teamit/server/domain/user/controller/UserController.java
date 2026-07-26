package com.teamit.server.domain.user.controller;

import com.teamit.server.domain.contest.dto.HeartedContestListResponse;
import com.teamit.server.domain.contest.service.ContestService;
import com.teamit.server.domain.review.dto.MyReceivedReviewListResponse;
import com.teamit.server.domain.review.service.ReviewService;
import com.teamit.server.domain.user.dto.*;
import com.teamit.server.domain.user.service.UserService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
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

@Tag(name = "User", description = "사용자 온보딩 및 프로필 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ContestService contestService;
    private final ReviewService reviewService;

    @Operation(summary = "내 프로필 조회 (온보딩 완료 여부 포함)")
    @GetMapping("/me")
    public ApiResponse<MyProfileResponse> getMe(@LoginUser CustomUserDetails userDetails) {
        MyProfileResponse response = userService.getMyProfile(userDetails.getUserId());
        return ApiResponse.success(response, "내 프로필 조회 성공");
    }

    @Operation(summary = "내 프로필 기본정보 수정")
    @PatchMapping("/me")
    public ApiResponse<Void> updateMyProfile(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody UpdateMyProfileRequest request) {
        userService.updateMyProfile(userDetails.getUserId(), request);
        return ApiResponse.success(null, "프로필이 수정되었습니다");
    }

    @Operation(summary = "프로필 사진 등록/변경")
    @PostMapping(value = "/me/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> updateProfileImage(
            @LoginUser CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        String url = userService.updateProfileImage(userDetails.getUserId(), file);
        return ApiResponse.success(Map.of("profileImageUrl", url), "프로필 사진이 등록되었습니다");
    }

    @Operation(summary = "프로필 사진 삭제")
    @DeleteMapping("/me/profile-image")
    public ApiResponse<Void> deleteProfileImage(@LoginUser CustomUserDetails userDetails) {
        userService.deleteProfileImage(userDetails.getUserId());
        return ApiResponse.success(null, "프로필 사진이 삭제되었습니다");
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

    @Operation(summary = "특정 유저 경력 조회 (공개)")
    @GetMapping("/{userId}/careers")
    public ApiResponse<List<CareerItemResponse>> getUserCareers(@PathVariable Long userId) {
        return ApiResponse.success(userService.getUserCareers(userId), "경력 조회 성공");
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

    @Operation(summary = "유저 상세 프로필 조회")
    @GetMapping("/{userId}")
    public ApiResponse<UserDetailResponse> getUserDetail(
            @PathVariable Long userId,
            @LoginUser CustomUserDetails userDetails) {
        // 비로그인 사용자도 조회 가능(permitAll) — isHearted만 false로 빠진다
        Long viewerUserId = userDetails != null ? userDetails.getUserId() : null;
        UserDetailResponse response = userService.getUserDetail(userId, viewerUserId);
        return ApiResponse.success(response, "유저 상세 조회 성공");
    }

    @Operation(summary = "매칭 프로필 조회")
    @GetMapping("/matching-profile")
    public ApiResponse<MatchingProfileData> getMatchingProfile(
            @LoginUser CustomUserDetails userDetails) {
        MatchingProfileData response = userService.getMatchingProfile(userDetails.getUserId());
        return ApiResponse.success(response, "매칭 프로필 조회 성공");
    }

    @Operation(summary = "매칭 프로필 저장/수정")
    @PutMapping("/matching-profile")
    public ApiResponse<Void> saveMatchingProfile(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody MatchingProfileData request) {
        userService.saveMatchingProfile(userDetails.getUserId(), request);
        return ApiResponse.success(null, "매칭 프로필이 저장되었습니다");
    }

    @Operation(summary = "최근 제출한 참여 카드 조회", description = "가장 최근에 제출한 공모전 참여 카드(스냅샷)를 조회합니다. 제출 이력이 없으면 현재 매칭 프로필을 반환합니다.")
    @GetMapping("/matching-profile/latest-submission")
    public ApiResponse<MatchingProfileData> getLatestParticipationCard(
            @LoginUser CustomUserDetails userDetails) {
        MatchingProfileData response = userService.getLatestParticipationCard(userDetails.getUserId());
        return ApiResponse.success(response, "최근 참여 카드 조회 성공");
    }

    @Operation(summary = "매칭 활성화 상태 변경")
    @PatchMapping("/matching-status")
    public ApiResponse<Void> setMatchingStatus(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody Map<String, Boolean> body) {
        Boolean isMatchingActive = body.get("isMatchingActive");
        if (isMatchingActive == null) {
            throw new IllegalArgumentException("isMatchingActive 값이 필요합니다");
        }
        userService.setMatchingActive(userDetails.getUserId(), isMatchingActive);
        return ApiResponse.success(null, "매칭 상태가 변경되었습니다");
    }

    @Operation(summary = "공모전 경력 추가")
    @PostMapping("/careers/contests")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CareerItemResponse> addContestCareer(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody AddContestCareerRequest request) {
        CareerItemResponse response = userService.addContestCareer(userDetails.getUserId(), request);
        return ApiResponse.success(response, "공모전 경력이 등록되었습니다");
    }

    @Operation(summary = "자격증 경력 추가")
    @PostMapping("/careers/certificates")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CareerItemResponse> addCertificateCareer(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody AddCertificateCareerRequest request) {
        CareerItemResponse response = userService.addCertificateCareer(userDetails.getUserId(), request);
        return ApiResponse.success(response, "자격증이 등록되었습니다");
    }

    @Operation(summary = "공모전 경력 수정")
    @PatchMapping("/careers/contests/{careerItemId}")
    public ApiResponse<CareerItemResponse> updateContestCareer(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long careerItemId,
            @RequestBody AddContestCareerRequest request) {
        CareerItemResponse response = userService.updateContestCareer(userDetails.getUserId(), careerItemId, request);
        return ApiResponse.success(response, "공모전 경력이 수정되었습니다");
    }

    @Operation(summary = "자격증 경력 수정")
    @PatchMapping("/careers/certificates/{careerItemId}")
    public ApiResponse<CareerItemResponse> updateCertificateCareer(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long careerItemId,
            @RequestBody AddCertificateCareerRequest request) {
        CareerItemResponse response = userService.updateCertificateCareer(userDetails.getUserId(), careerItemId, request);
        return ApiResponse.success(response, "자격증이 수정되었습니다");
    }

    @Operation(summary = "경력 삭제")
    @DeleteMapping("/careers/{careerItemId}")
    public ApiResponse<Void> deleteCareer(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long careerItemId) {
        userService.deleteCareer(userDetails.getUserId(), careerItemId);
        return ApiResponse.success(null, "경력이 삭제되었습니다");
    }

    @Operation(summary = "나의 모집글 지원 내역")
    @GetMapping("/my-applications")
    public ApiResponse<List<MyApplicationResponse>> getMyApplications(
            @LoginUser CustomUserDetails userDetails) {
        return ApiResponse.success(
                userService.getMyApplications(userDetails.getUserId()),
                "지원 내역 조회 성공");
    }

    @Operation(summary = "공모전 후보 등록 내역")
    @GetMapping("/contest-registrations")
    public ApiResponse<List<ContestRegistrationResponse>> getContestRegistrations(
            @LoginUser CustomUserDetails userDetails) {
        return ApiResponse.success(
                userService.getContestRegistrations(userDetails.getUserId()),
                "공모전 후보 등록 내역 조회 성공");
    }

    @Operation(summary = "게시글 지원 취소")
    @DeleteMapping("/my-applications/{applicationId}")
    public ApiResponse<Void> cancelApplication(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long applicationId) {
        userService.cancelApplication(applicationId, userDetails.getUserId());
        return ApiResponse.success(null, "지원이 취소됐어요.");
    }

    @Operation(summary = "내가 받은 리뷰 전체 조회", description = "프로젝트 구분 없이 내가 받은 리뷰 전체와 평균 별점을 조회합니다. 리뷰어 정보는 포함되지 않습니다(익명).")
    @GetMapping("/reviews/received")
    public ApiResponse<MyReceivedReviewListResponse> getMyReceivedReviews(
            @LoginUser CustomUserDetails userDetails) {
        return ApiResponse.success(
                reviewService.getMyReceivedReviews(userDetails.getUserId()),
                "받은 리뷰 조회 성공");
    }
}
