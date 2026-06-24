package com.teamit.server.domain.post.controller;

import com.teamit.server.domain.post.dto.CreatePostRequest;
import com.teamit.server.domain.post.dto.PostDetailResponse;
import com.teamit.server.domain.post.dto.PostListItemResponse;
import com.teamit.server.domain.post.service.PostService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Post", description = "모집글 API")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @Operation(summary = "모집글 생성")
    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PostListItemResponse> createPost(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody CreatePostRequest request) {
        return ApiResponse.success(
                postService.createPost(userDetails.getUserId(), request),
                "모집글이 등록되었습니다");
    }

    @Operation(summary = "모집글 상세 조회")
    @GetMapping("/posts/{postId}")
    public ApiResponse<PostDetailResponse> getPostDetail(@PathVariable Long postId) {
        return ApiResponse.success(postService.getPostDetail(postId), "모집글 조회 성공");
    }

    @Operation(summary = "공모전별 모집글 목록 조회")
    @GetMapping("/contests/{contestId}/posts")
    public ApiResponse<List<PostListItemResponse>> getPostsByContest(@PathVariable Long contestId) {
        return ApiResponse.success(postService.getPostsByContest(contestId), "모집글 목록 조회 성공");
    }

    @Operation(summary = "내 모집글 목록 조회")
    @GetMapping("/users/posts")
    public ApiResponse<List<PostListItemResponse>> getMyPosts(
            @LoginUser CustomUserDetails userDetails) {
        return ApiResponse.success(postService.getMyPosts(userDetails.getUserId()), "내 모집글 조회 성공");
    }

    @Operation(summary = "모집글 마감")
    @PatchMapping("/posts/{postId}/close")
    public ApiResponse<PostListItemResponse> closePost(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails) {
        return ApiResponse.success(
                postService.closePost(postId, userDetails.getUserId()),
                "모집글이 마감 처리되었습니다");
    }
}
