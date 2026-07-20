package com.teamit.server.domain.review.controller;

import com.teamit.server.domain.review.dto.*;
import com.teamit.server.domain.review.service.ReviewService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Review", description = "팀원 리뷰 API")
@RestController
@RequestMapping("/api/v1/chat-rooms/{chatRoomId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "팀원 리뷰 제출", description = "같은 채팅방 멤버에게 리뷰를 제출합니다. 한 상대에게 한 번만 제출할 수 있습니다.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SubmitReviewResponse> submitReview(
            @PathVariable Long chatRoomId,
            @LoginUser CustomUserDetails userDetails,
            @RequestBody SubmitReviewRequest request) {
        SubmitReviewResponse response = reviewService.submitReview(chatRoomId, userDetails.getUserId(), request);
        return ApiResponse.success(response, "리뷰가 제출되었습니다");
    }

    @Operation(summary = "받은 리뷰 목록 조회", description = "이 채팅방에서 내가 받은 리뷰 목록을 조회합니다.")
    @GetMapping("/received")
    public ApiResponse<ReceivedReviewListResponse> getReceivedReviews(
            @PathVariable Long chatRoomId,
            @LoginUser CustomUserDetails userDetails) {
        ReceivedReviewListResponse response = reviewService.getReceivedReviews(chatRoomId, userDetails.getUserId());
        return ApiResponse.success(response, "받은 리뷰 목록 조회 성공");
    }

    @Operation(summary = "내가 제출한 리뷰 대상 목록 조회", description = "이 채팅방에서 내가 이미 리뷰를 제출한 상대방 id 목록을 조회합니다.")
    @GetMapping("/my-submitted")
    public ApiResponse<MySubmittedReviewsResponse> getMySubmittedReviews(
            @PathVariable Long chatRoomId,
            @LoginUser CustomUserDetails userDetails) {
        MySubmittedReviewsResponse response =
                reviewService.getMySubmittedReceiverIds(chatRoomId, userDetails.getUserId());
        return ApiResponse.success(response, "제출한 리뷰 목록 조회 성공");
    }
}
