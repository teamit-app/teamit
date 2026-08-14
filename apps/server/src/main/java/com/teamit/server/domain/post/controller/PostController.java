package com.teamit.server.domain.post.controller;

import com.teamit.server.domain.post.dto.AddCommentRequest;
import com.teamit.server.domain.post.dto.CreatePostRequest;
import com.teamit.server.domain.post.dto.LikedPostResponse;
import com.teamit.server.domain.post.dto.PostCommentResponse;
import com.teamit.server.domain.post.dto.PostDetailResponse;
import com.teamit.server.domain.post.dto.PostListItemResponse;
import com.teamit.server.domain.post.dto.PostPageResponse;
import com.teamit.server.domain.post.dto.PostSortOption;
import com.teamit.server.domain.post.dto.UpdatePostRequest;
import com.teamit.server.domain.post.service.PostService;
import com.teamit.server.domain.user.dto.PostApplicantPageResponse;
import com.teamit.server.domain.user.dto.PostApplicantResponse;
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

    @Operation(summary = "모집글 생성", description = "모집글 생성 시 팀 채팅방이 자동으로 만들어집니다.")
    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PostListItemResponse> createPost(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody CreatePostRequest request) {
        return ApiResponse.success(
                postService.createPost(userDetails.getUserId(), request),
                "모집글이 등록되었습니다");
    }

    @Operation(summary = "모집글 단건 조회")
    @GetMapping("/posts/{postId}")
    public ApiResponse<PostDetailResponse> getPostDetail(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails) {
        // 비로그인 사용자도 조회 가능(permitAll) — isHearted/isApplied만 false로 빠진다
        Long viewerUserId = userDetails != null ? userDetails.getUserId() : null;
        return ApiResponse.success(
                postService.getPostDetail(postId, viewerUserId), "모집글 조회 성공");
    }

    @Operation(summary = "모집글 좋아요")
    @PostMapping("/posts/{postId}/hearts")
    public ApiResponse<Void> addPostHeart(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails) {
        postService.addPostHeart(userDetails.getUserId(), postId);
        return ApiResponse.success(null, "좋아요가 등록되었습니다");
    }

    @Operation(summary = "모집글 좋아요 취소")
    @DeleteMapping("/posts/{postId}/hearts")
    public ApiResponse<Void> removePostHeart(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails) {
        postService.removePostHeart(userDetails.getUserId(), postId);
        return ApiResponse.success(null, "좋아요가 취소되었습니다");
    }

    @Operation(summary = "모집글 댓글 목록 조회")
    @GetMapping("/posts/{postId}/comments")
    public ApiResponse<List<PostCommentResponse>> getComments(@PathVariable Long postId) {
        return ApiResponse.success(postService.getComments(postId), "댓글 목록 조회 성공");
    }

    @Operation(summary = "모집글 댓글 작성")
    @PostMapping("/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PostCommentResponse> addComment(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails,
            @RequestBody AddCommentRequest request) {
        return ApiResponse.success(
                postService.addComment(postId, userDetails.getUserId(), request), "댓글이 등록되었습니다");
    }

    @Operation(summary = "전체 모집글 목록 조회", description = "모든 모집글을 최신순 또는 조회수순으로 페이징 조회합니다.")
    @GetMapping("/posts")
    public ApiResponse<PostPageResponse> getPostList(
            @RequestParam(defaultValue = "LATEST") PostSortOption sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(postService.getPostList(sort, page, size), "모집글 목록 조회 성공");
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

    @Operation(summary = "좋아요한 모집글 목록 조회")
    @GetMapping("/users/liked-posts")
    public ApiResponse<List<LikedPostResponse>> getLikedPosts(
            @LoginUser CustomUserDetails userDetails) {
        return ApiResponse.success(postService.getLikedPosts(userDetails.getUserId()), "좋아요한 모집글 조회 성공");
    }

    @Operation(summary = "팀 확정", description = "모집자가 팀원을 확정합니다. 팀 현황에 '팀원 확정'으로 표시됩니다. (리뷰 작성 개방은 공모전 마감일 기준이며 이 API와는 별개입니다)")
    @PatchMapping("/posts/{postId}/confirm-team")
    public ApiResponse<Void> confirmTeam(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails) {
        postService.confirmTeam(postId, userDetails.getUserId());
        return ApiResponse.success(null, "팀이 확정되었습니다");
    }

    @Operation(summary = "후보 목록 조회", description = "모집글에 초대할 매칭 활성 유저 목록 (최대 20명)")
    @GetMapping("/users/posts/{postId}/candidates")
    public ApiResponse<List<PostApplicantResponse>> getCandidates(@PathVariable Long postId) {
        return ApiResponse.success(postService.getCandidates(postId), "후보 목록 조회 성공");
    }

    @Operation(summary = "전체 후보 목록 조회", description = "하드필터·스코어링 없이 이 공모전에 등록된 모든 후보를 페이징으로 조회합니다.")
    @GetMapping("/users/posts/{postId}/candidates/all")
    public ApiResponse<PostApplicantPageResponse> getAllCandidates(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(postService.getAllCandidates(postId, page, size), "전체 후보 목록 조회 성공");
    }

    @Operation(summary = "지원자 목록 조회", description = "해당 모집글에 직접 지원한 사람들의 목록을 조회합니다. 작성자만 호출 가능합니다.")
    @GetMapping("/users/posts/{postId}/applicants")
    public ApiResponse<List<PostApplicantResponse>> getApplicants(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails) {
        return ApiResponse.success(postService.getApplicants(postId, userDetails.getUserId()), "지원자 목록 조회 성공");
    }

    @Operation(summary = "모집글 수정", description = "작성자만 제목과 본문을 수정할 수 있습니다.")
    @PatchMapping("/posts/{postId}")
    public ApiResponse<Void> updatePost(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails,
            @RequestBody UpdatePostRequest request) {
        postService.updatePost(postId, userDetails.getUserId(), request);
        return ApiResponse.success(null, "모집글이 수정되었습니다");
    }

    @Operation(summary = "모집글 삭제", description = "작성자만 삭제할 수 있습니다.")
    @DeleteMapping("/posts/{postId}")
    public ApiResponse<Void> deletePost(
            @PathVariable Long postId,
            @LoginUser CustomUserDetails userDetails) {
        postService.deletePost(postId, userDetails.getUserId());
        return ApiResponse.success(null, "모집글이 삭제되었습니다");
    }
}
