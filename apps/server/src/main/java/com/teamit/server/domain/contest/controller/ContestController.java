package com.teamit.server.domain.contest.controller;

import com.teamit.server.domain.contest.dto.ContestDetailResponse;
import com.teamit.server.domain.contest.dto.ContestPageResponse;
import com.teamit.server.domain.contest.dto.PopularContestListResponse;
import com.teamit.server.domain.contest.entity.ContestCategory;
import com.teamit.server.domain.contest.entity.ContestStatus;
import com.teamit.server.domain.contest.service.ContestService;
import com.teamit.server.domain.post.service.PostService;
import com.teamit.server.domain.user.dto.MatchingProfileData;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Contest", description = "공모전 API")
@RestController
@RequestMapping("/api/v1/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestService contestService;
    private final PostService postService;

    @Operation(summary = "금주의 인기 공모전 목록", description = "진행중인 공모전을 최신순으로 조회합니다.")
    @GetMapping("/popular")
    public ApiResponse<PopularContestListResponse> getPopularContests() {
        PopularContestListResponse response = contestService.getPopularContests();
        return ApiResponse.success(response, "인기 공모전 목록 조회 성공");
    }

    @Operation(summary = "공모전 상세 조회", description = "공모전 ID로 공모전 상세 정보를 조회합니다.")
    @GetMapping("/{contestId}")
    public ApiResponse<ContestDetailResponse> getContestDetail(@PathVariable Long contestId) {
        ContestDetailResponse response = contestService.getContestDetail(contestId);
        return ApiResponse.success(response, "공모전 상세 조회 성공");
    }

    @Operation(summary = "팀 매칭 후보 등록",
            description = "해당 공모전의 팀 매칭 후보로 등록합니다. 매칭 활성화 상태도 함께 변경됩니다. " +
                    "body로 카드 내용을 넘기면 그 값 그대로 스냅샷을 만들고(라이브 매칭 프로필은 안 건드림), " +
                    "안 넘기면 라이브 매칭 프로필을 읽어서 스냅샷을 만듭니다.")
    @PostMapping("/{contestId}/participants")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> registerParticipant(
            @PathVariable Long contestId,
            @RequestBody(required = false) MatchingProfileData card,
            @LoginUser CustomUserDetails userDetails) {
        contestService.registerParticipant(contestId, userDetails.getUserId(), card);
        return ApiResponse.success(null, "팀 매칭 후보로 등록됐어요!");
    }

    @Operation(summary = "팀 매칭 후보 등록 취소", description = "모집글 작성으로 자동 등록된 후보라면 그 모집글도 함께 삭제됩니다.")
    @DeleteMapping("/{contestId}/participants")
    public ApiResponse<Void> cancelParticipant(
            @PathVariable Long contestId,
            @LoginUser CustomUserDetails userDetails) {
        contestService.cancelParticipant(contestId, userDetails.getUserId());
        postService.deleteMyPostForContest(contestId, userDetails.getUserId());
        return ApiResponse.success(null, "팀 매칭 후보 등록이 취소됐어요.");
    }

    @Operation(summary = "내 후보 등록 여부 확인", description = "해당 공모전에 팀 매칭 후보로 등록했는지 확인합니다.")
    @GetMapping("/{contestId}/participants/me")
    public ApiResponse<Map<String, Boolean>> checkIsParticipant(
            @PathVariable Long contestId,
            @LoginUser CustomUserDetails userDetails) {
        boolean isParticipant = contestService.isParticipant(contestId, userDetails.getUserId());
        return ApiResponse.success(Map.of("isParticipant", isParticipant), "후보 등록 여부 조회 성공");
    }

    @Operation(summary = "내가 후보 등록한 공모전 ID 목록", description = "로그인 사용자가 팀 매칭 후보로 등록한 공모전 ID 목록을 반환합니다.")
    @GetMapping("/my-participations")
    public ApiResponse<Map<String, Object>> getMyParticipations(
            @LoginUser CustomUserDetails userDetails) {
        java.util.List<Long> contestIds = contestService.getMyParticipationContestIds(userDetails.getUserId());
        return ApiResponse.success(Map.of("contestIds", contestIds), "참가 공모전 목록 조회 성공");
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
