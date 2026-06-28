package com.teamit.server.domain.post.service;

import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.repository.ContestRepository;
import com.teamit.server.domain.post.dto.CreatePostRequest;
import com.teamit.server.domain.post.dto.PostDetailResponse;
import com.teamit.server.domain.post.dto.PostListItemResponse;
import com.teamit.server.domain.post.entity.Post;
import com.teamit.server.domain.post.repository.PostRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ContestRepository contestRepository;

    // ──────────────────────────────────────────────────────────────
    // 모집글 생성
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public PostListItemResponse createPost(Long userId, CreatePostRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Post post = postRepository.save(Post.builder()
                .owner(owner)
                .title(request.getTitle())
                .description(request.getDescription())
                .contestId(request.getContestId())
                .recruitCount(request.getRecruitCount())
                .deadline(request.getDeadline())
                .onlineOffline(request.getOnlineOffline())
                .genderCondition(request.getGenderCondition())
                .schoolCondition(request.getSchoolCondition())
                .build());

        return PostListItemResponse.from(post);
    }

    // ──────────────────────────────────────────────────────────────
    // 모집글 상세 조회
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PostDetailResponse getPostDetail(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));

        Contest contest = post.getContestId() != null
                ? contestRepository.findById(post.getContestId()).orElse(null)
                : null;

        return PostDetailResponse.of(post, contest, post.getOwner());
    }

    // ──────────────────────────────────────────────────────────────
    // 공모전별 모집글 목록 조회
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostListItemResponse> getPostsByContest(Long contestId) {
        return postRepository.findByContestIdOrderByCreatedAtDesc(contestId).stream()
                .map(PostListItemResponse::from)
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────
    // 내 모집글 목록 조회
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostListItemResponse> getMyPosts(Long userId) {
        return postRepository.findByOwnerIdOrderByCreatedAtDesc(userId).stream()
                .map(PostListItemResponse::from)
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────
    // 모집글 마감
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public PostListItemResponse closePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        if (!post.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("마감 권한이 없습니다");
        }
        post.close();
        return PostListItemResponse.from(post);
    }
}
