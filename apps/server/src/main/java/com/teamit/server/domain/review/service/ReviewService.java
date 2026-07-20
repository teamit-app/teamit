package com.teamit.server.domain.review.service;

import com.teamit.server.domain.chat.entity.ChatRoom;
import com.teamit.server.domain.chat.repository.ChatRoomMemberRepository;
import com.teamit.server.domain.chat.repository.ChatRoomRepository;
import com.teamit.server.domain.review.dto.*;
import com.teamit.server.domain.review.entity.TeamReview;
import com.teamit.server.domain.review.repository.TeamReviewRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final TeamReviewRepository teamReviewRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final UserRepository userRepository;

    // ──────────────────────────────────────────────────────────────
    // 팀원 리뷰 제출 (같은 채팅방 멤버끼리만, 중복 제출 불가)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public SubmitReviewResponse submitReview(Long chatRoomId, Long reviewerId, SubmitReviewRequest request) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다"));

        if (reviewerId.equals(request.getReceiverId())) {
            throw new IllegalArgumentException("자기 자신을 리뷰할 수 없습니다");
        }

        chatRoomMemberRepository.findByUserIdAndChatRoomId(reviewerId, chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방 멤버만 리뷰를 작성할 수 있습니다"));
        chatRoomMemberRepository.findByUserIdAndChatRoomId(request.getReceiverId(), chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("같은 팀 멤버만 리뷰할 수 있습니다"));

        if (teamReviewRepository.existsByChatRoomIdAndReviewerIdAndReceiverId(
                chatRoomId, reviewerId, request.getReceiverId())) {
            throw new IllegalStateException("이미 이 팀원에게 리뷰를 작성했습니다");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("리뷰 대상을 찾을 수 없습니다"));

        TeamReview review = teamReviewRepository.save(TeamReview.builder()
                .chatRoom(chatRoom)
                .reviewer(reviewer)
                .receiver(receiver)
                .totalRating(request.getTotalRating())
                .responseSpeed(request.getResponseSpeed())
                .deadlineCompletion(request.getDeadlineCompletion())
                .participationIntensity(request.getParticipationIntensity())
                .keywords(request.getKeywords())
                .comment(request.getComment())
                .build());

        return SubmitReviewResponse.builder().reviewId(review.getId()).build();
    }

    // ──────────────────────────────────────────────────────────────
    // 이 채팅방에서 내가 받은 리뷰 목록 조회
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ReceivedReviewListResponse getReceivedReviews(Long chatRoomId, Long userId) {
        List<ReceivedReviewResponse> reviews = teamReviewRepository
                .findByChatRoomIdAndReceiverId(chatRoomId, userId).stream()
                .sorted(java.util.Comparator.comparing(TeamReview::getCreatedAt).reversed())
                .map(r -> ReceivedReviewResponse.builder()
                        .reviewerId(r.getReviewer().getId())
                        .reviewerName(r.getReviewer().getNickname())
                        .totalRating(r.getTotalRating())
                        .responseSpeed(r.getResponseSpeed())
                        .deadlineCompletion(r.getDeadlineCompletion())
                        .participationIntensity(r.getParticipationIntensity())
                        .keywords(r.getKeywords())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ReceivedReviewListResponse.builder().reviews(reviews).build();
    }

    // ──────────────────────────────────────────────────────────────
    // 이 채팅방에서 내가 이미 리뷰를 제출한 상대방 id 목록
    // (리뷰 작성 화면의 "작성 완료" 표시, 내가 받은 리뷰 잠금 해제 판단에 사용)
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public MySubmittedReviewsResponse getMySubmittedReceiverIds(Long chatRoomId, Long reviewerId) {
        List<Long> receiverIds = teamReviewRepository
                .findByChatRoomIdAndReviewerId(chatRoomId, reviewerId).stream()
                .map(r -> r.getReceiver().getId())
                .collect(Collectors.toList());
        return MySubmittedReviewsResponse.builder().receiverIds(receiverIds).build();
    }

    // ──────────────────────────────────────────────────────────────
    // 마이페이지 "리뷰 확인" — 프로젝트 구분 없이 내가 받은 리뷰 전체를 집계.
    // 리뷰어 정보는 절대 포함하지 않는다(익명 정책) — AnonymousReviewItem 참고
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public MyReceivedReviewListResponse getMyReceivedReviews(Long userId) {
        List<TeamReview> reviews = teamReviewRepository.findByReceiverId(userId);

        double averageRating = reviews.stream()
                .mapToInt(TeamReview::getTotalRating)
                .average()
                .orElse(0.0);

        List<AnonymousReviewItem> items = reviews.stream()
                .sorted(java.util.Comparator.comparing(TeamReview::getCreatedAt).reversed())
                .map(r -> AnonymousReviewItem.builder()
                        .totalRating(r.getTotalRating())
                        .responseSpeed(r.getResponseSpeed())
                        .deadlineCompletion(r.getDeadlineCompletion())
                        .participationIntensity(r.getParticipationIntensity())
                        .keywords(r.getKeywords())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return MyReceivedReviewListResponse.builder()
                .averageRating(Math.round(averageRating * 10) / 10.0)
                .totalCount(reviews.size())
                .reviews(items)
                .build();
    }
}
