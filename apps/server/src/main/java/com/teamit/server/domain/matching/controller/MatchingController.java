package com.teamit.server.domain.matching.controller;

import com.teamit.server.domain.matching.dto.*;
import com.teamit.server.domain.matching.service.MatchingService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Matching", description = "매칭(지원/초대) API")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    @Operation(summary = "지원하기", description = "모집글에 지원합니다. 지원 시 모집글 작성자와 DIRECT 채팅방이 자동 생성됩니다.")
    @PostMapping("/posts/{postId}/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ApplyPostResponse> apply(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails,
            @RequestBody ApplyPostRequest request) {
        ApplyPostResponse response = matchingService.apply(postId, userDetails.getUserId(), request);
        return ApiResponse.success(response, "지원이 완료됐어요! 채팅방이 생성되었습니다");
    }

    @Operation(summary = "팀 초대", description = "인재풀 사용자에게 팀 초대를 보냅니다. 초대 시 DIRECT 채팅방이 자동 생성됩니다.")
    @PostMapping("/posts/{postId}/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InviteTeamResponse> invite(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails,
            @RequestBody InviteTeamRequest request) {
        InviteTeamResponse response = matchingService.invite(postId, userDetails.getUserId(), request);
        return ApiResponse.success(response, "초대를 보냈어요! 채팅방이 생성되었습니다");
    }

    @Operation(summary = "매칭 수락", description = "지원/초대를 수락합니다. 수락 시 GROUP 채팅방이 자동 생성됩니다. type: applications | invitations")
    @PatchMapping("/matching/{type}/{id}/accept")
    public ApiResponse<AcceptMatchingResponse> accept(
            @PathVariable String type,
            @PathVariable Long id) {
        AcceptMatchingResponse response = matchingService.accept(type, id);
        return ApiResponse.success(response, "매칭이 성사됐어요! 팀 채팅방에서 만나요");
    }

    @Operation(summary = "매칭 거절", description = "지원/초대를 거절합니다. type: applications | invitations")
    @PatchMapping("/matching/{type}/{id}/reject")
    public ApiResponse<Void> reject(
            @PathVariable String type,
            @PathVariable Long id) {
        matchingService.reject(type, id);
        return ApiResponse.success(null, "거절 처리되었습니다");
    }
}
