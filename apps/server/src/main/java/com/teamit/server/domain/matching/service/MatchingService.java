package com.teamit.server.domain.matching.service;

import com.teamit.server.domain.chat.entity.ChatRoom;
import com.teamit.server.domain.chat.service.ChatService;
import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.repository.ContestRepository;
import com.teamit.server.domain.matching.dto.*;
import com.teamit.server.domain.matching.entity.*;
import com.teamit.server.domain.matching.repository.*;
import com.teamit.server.domain.notification.entity.NotificationType;
import com.teamit.server.domain.notification.service.NotificationService;
import com.teamit.server.domain.post.entity.Post;
import com.teamit.server.domain.post.entity.PostStatus;
import com.teamit.server.domain.post.repository.PostRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class MatchingService {

    private final PostApplicationRepository applicationRepository;
    private final TeamInvitationRepository invitationRepository;
    private final PostRepository postRepository;
    private final ContestRepository contestRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;
    private final NotificationService notificationService;

    // 공모전이 마감(endDate 경과)되면 모집글도 더 이상 지원·초대를 받을 수 없어야 한다
    // (PostService.effectiveStatus와 동일한 원칙 — Post.status 컬럼만으로는 판단 불가)
    private boolean isPostClosed(Post post) {
        if (post.getStatus() == PostStatus.CLOSED) return true;
        if (post.getContestId() == null) return false;
        return contestRepository.findById(post.getContestId())
                .map(Contest::getEndDate)
                .map(endDate -> endDate.isBefore(LocalDate.now()))
                .orElse(false);
    }

    // ──────────────────────────────────────────────────────────────
    // 지원하기 → DIRECT 채팅방 자동 생성
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public ApplyPostResponse apply(Long postId, Long applicantId, ApplyPostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        User applicant = userRepository.findById(applicantId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        if (applicationRepository.findByPostIdAndApplicantId(postId, applicantId).isPresent()) {
            throw new IllegalStateException("이미 지원한 모집글입니다");
        }
        if (isPostClosed(post)) {
            throw new IllegalStateException("마감된 모집글에는 지원할 수 없습니다");
        }

        // 채팅 기능 미완성 — 지원 시점에는 채팅방을 생성하지 않는다
        PostApplication application = applicationRepository.save(PostApplication.builder()
                .post(post)
                .applicant(applicant)
                .appealText(request.getAppealText())
                .status(ApplicationStatus.PENDING)
                .build());

        notificationService.notifyIfEnabled(post.getOwner().getId(), NotificationType.MATCH_PROPOSAL,
                "새로운 지원자가 있어요", applicant.getNickname() + "님이 \"" + post.getTitle() + "\"에 지원했어요",
                application.getId(), "APPLICATION");

        return ApplyPostResponse.builder()
                .applicationId(application.getId())
                .status(application.getStatus().name())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 팀 초대 → DIRECT 채팅방 자동 생성
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public InviteTeamResponse invite(Long postId, Long senderId, InviteTeamRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        if (!post.getOwner().getId().equals(senderId)) {
            throw new IllegalArgumentException("초대 권한이 없습니다");
        }
        if (isPostClosed(post)) {
            throw new IllegalStateException("팀이 이미 확정된 모집글입니다");
        }
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("초대자를 찾을 수 없습니다"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("수신자를 찾을 수 없습니다"));

        // 이미 수락 대기 중이거나, 한 번 거절한 사용자에게는 다시 초대를 보낼 수 없음
        boolean alreadyInvited = invitationRepository.findAllByPostId(postId).stream()
                .anyMatch(i -> i.getReceiver().getId().equals(receiver.getId())
                        && (i.getStatus() == InvitationStatus.PENDING
                            || i.getStatus() == InvitationStatus.REJECTED));
        if (alreadyInvited) {
            throw new IllegalStateException("이미 초대를 보냈거나 거절한 사용자에게는 다시 초대를 보낼 수 없습니다");
        }

        // 초대자 ↔ 수신자 간 기존 1:1 채팅방이 있으면 재사용, 없으면 생성
        ChatRoom chatRoom = chatService.findOrCreateDirectChatRoom(sender.getId(), receiver.getId());

        TeamInvitation invitation = invitationRepository.save(TeamInvitation.builder()
                .post(post)
                .sender(sender)
                .receiver(receiver)
                .message(request.getMessage())
                .status(InvitationStatus.PENDING)
                .chatRoom(chatRoom)
                .build());

        chatService.sendInvitationMessages(chatRoom, sender, receiver, invitation.getId());

        notificationService.notifyIfEnabled(receiver.getId(), NotificationType.MATCH_PROPOSAL,
                "새로운 팀 제안이 왔어요", "\"" + post.getTitle() + "\" 팀에서 초대를 보냈어요",
                invitation.getId(), "INVITATION");

        return InviteTeamResponse.builder()
                .invitationId(invitation.getId())
                .status(invitation.getStatus().name())
                .chatRoomId(chatRoom.getId())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 모집자가 보낸 초대장 목록 조회 (초대 시트 상태 유지용)
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<SentInvitationResponse> getSentInvitations(Long postId, Long requesterId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        if (!post.getOwner().getId().equals(requesterId)) {
            throw new IllegalArgumentException("조회 권한이 없습니다");
        }

        return invitationRepository.findAllByPostId(postId).stream()
                .map(i -> SentInvitationResponse.builder()
                        .invitationId(i.getId())
                        .receiverId(i.getReceiver().getId())
                        .receiverNickname(i.getReceiver().getNickname())
                        .status(i.getStatus().name())
                        .build())
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────
    // 초대 취소 (모집자가 자신이 보낸 PENDING 초대를 철회 — 상대에게 재초대 가능해짐)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void cancelInvitation(Long postId, Long invitationId, Long requesterId) {
        TeamInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("초대 정보를 찾을 수 없습니다"));
        if (!invitation.getPost().getId().equals(postId)) {
            throw new IllegalArgumentException("해당 모집글의 초대가 아닙니다");
        }
        if (!invitation.getSender().getId().equals(requesterId)) {
            throw new IllegalArgumentException("취소 권한이 없습니다");
        }
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("대기 중인 초대만 취소할 수 있습니다");
        }
        invitationRepository.delete(invitation);
    }

    // ──────────────────────────────────────────────────────────────
    // 매칭 수락 → 기존 팀 채팅방에 멤버 추가
    // type: "applications" | "invitations"
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public AcceptMatchingResponse accept(String type, Long id) {
        Long chatRoomId;

        if ("applications".equals(type)) {
            PostApplication application = applicationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("지원 정보를 찾을 수 없습니다"));
            if (isPostClosed(application.getPost())) {
                throw new IllegalStateException("이미 마감된 모집글에는 팀원을 추가할 수 없습니다");
            }
            application.accept();

            chatRoomId = application.getPost().getChatRoomId();
            if (chatRoomId == null) throw new IllegalStateException("팀 채팅방이 존재하지 않습니다");
            chatService.addMemberToGroupChatRoom(chatRoomId, application.getApplicant().getId());

            notificationService.notifyIfEnabled(application.getApplicant().getId(), NotificationType.PROPOSAL_RESPONSE,
                    "지원이 수락됐어요", "\"" + application.getPost().getTitle() + "\" 지원이 수락됐어요",
                    application.getId(), "APPLICATION");

        } else if ("invitations".equals(type)) {
            TeamInvitation invitation = invitationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("초대 정보를 찾을 수 없습니다"));
            if (isPostClosed(invitation.getPost())) {
                throw new IllegalStateException("이미 마감된 모집글에는 팀원을 추가할 수 없습니다");
            }
            invitation.accept();

            chatRoomId = invitation.getPost().getChatRoomId();
            if (chatRoomId == null) throw new IllegalStateException("팀 채팅방이 존재하지 않습니다");
            chatService.addMemberToGroupChatRoom(chatRoomId, invitation.getReceiver().getId());

            notificationService.notifyIfEnabled(invitation.getSender().getId(), NotificationType.PROPOSAL_RESPONSE,
                    "초대가 수락됐어요", invitation.getReceiver().getNickname() + "님이 초대를 수락했어요",
                    invitation.getId(), "INVITATION");

        } else {
            throw new IllegalArgumentException("type은 applications 또는 invitations 이어야 합니다");
        }

        return AcceptMatchingResponse.builder()
                .groupChatRoomId(chatRoomId)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 받은 초대 목록 조회 (수신자 기준, PENDING 상태만)
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ReceivedInvitationListResponse getReceivedInvitations(Long userId) {
        List<ReceivedInvitationResponse> content = invitationRepository.findAllByReceiverId(userId).stream()
                .filter(i -> i.getStatus() == InvitationStatus.PENDING)
                .map(i -> ReceivedInvitationResponse.builder()
                        .invitationId(i.getId())
                        .postId(i.getPost().getId())
                        .title(i.getPost().getTitle())
                        .currentMembers(1)   // TODO: 팀 멤버 수 연동 후 교체
                        .totalMembers(2)     // TODO: Post.recruitCount 컬럼 추가 후 교체
                        .contestName("")     // TODO: Post-Contest 연관관계 추가 후 교체
                        .senderName(i.getSender().getNickname())
                        .receivedAt(i.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());
        return ReceivedInvitationListResponse.builder().content(content).build();
    }

    // ──────────────────────────────────────────────────────────────
    // 초대 수락 (수신자가 직접 수락, 기존 팀 채팅방에 멤버 추가)
    // 초대를 보낸 뒤 상대가 수락하기 전에 모집글이 마감될 수 있다 — 이 경우 예외를 던지되,
    // 더 이상 유효하지 않은 초대장은 삭제해서 정리한다(noRollbackFor로 삭제는 커밋되게 함)
    // ──────────────────────────────────────────────────────────────
    @Transactional(noRollbackFor = IllegalStateException.class)
    public void acceptByReceiver(Long invitationId, Long userId) {
        TeamInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("초대 정보를 찾을 수 없습니다"));
        if (!invitation.getReceiver().getId().equals(userId)) {
            throw new IllegalArgumentException("수락 권한이 없습니다");
        }
        if (isPostClosed(invitation.getPost())) {
            invitationRepository.delete(invitation);
            throw new IllegalStateException("이미 마감된 모집글입니다");
        }
        invitation.accept();

        Long chatRoomId = invitation.getPost().getChatRoomId();
        if (chatRoomId == null) throw new IllegalStateException("팀 채팅방이 존재하지 않습니다");
        chatService.addMemberToGroupChatRoom(chatRoomId, userId);

        notificationService.notifyIfEnabled(invitation.getSender().getId(), NotificationType.PROPOSAL_RESPONSE,
                "초대가 수락됐어요", invitation.getReceiver().getNickname() + "님이 초대를 수락했어요",
                invitation.getId(), "INVITATION");
    }

    // ──────────────────────────────────────────────────────────────
    // 초대 거절 (수신자가 직접 거절)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void declineByReceiver(Long invitationId, Long userId) {
        TeamInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("초대 정보를 찾을 수 없습니다"));
        if (!invitation.getReceiver().getId().equals(userId)) {
            throw new IllegalArgumentException("거절 권한이 없습니다");
        }
        invitation.reject();

        notificationService.notifyIfEnabled(invitation.getSender().getId(), NotificationType.PROPOSAL_RESPONSE,
                "초대가 거절됐어요", invitation.getReceiver().getNickname() + "님이 초대를 거절했어요",
                invitation.getId(), "INVITATION");
    }

    // ──────────────────────────────────────────────────────────────
    // 매칭 거절
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void reject(String type, Long id) {
        if ("applications".equals(type)) {
            PostApplication application = applicationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("지원 정보를 찾을 수 없습니다"));
            application.reject();

            notificationService.notifyIfEnabled(application.getApplicant().getId(), NotificationType.PROPOSAL_RESPONSE,
                    "지원이 거절됐어요", "\"" + application.getPost().getTitle() + "\" 지원이 거절됐어요",
                    application.getId(), "APPLICATION");
        } else if ("invitations".equals(type)) {
            TeamInvitation invitation = invitationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("초대 정보를 찾을 수 없습니다"));
            invitation.reject();

            notificationService.notifyIfEnabled(invitation.getSender().getId(), NotificationType.PROPOSAL_RESPONSE,
                    "초대가 거절됐어요", invitation.getReceiver().getNickname() + "님이 초대를 거절했어요",
                    invitation.getId(), "INVITATION");
        } else {
            throw new IllegalArgumentException("type은 applications 또는 invitations 이어야 합니다");
        }
    }
}
