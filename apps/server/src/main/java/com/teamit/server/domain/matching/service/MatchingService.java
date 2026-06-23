package com.teamit.server.domain.matching.service;

import com.teamit.server.domain.chat.entity.ChatRoom;
import com.teamit.server.domain.chat.service.ChatService;
import com.teamit.server.domain.matching.dto.*;
import com.teamit.server.domain.matching.entity.*;
import com.teamit.server.domain.matching.repository.*;
import com.teamit.server.domain.post.entity.Post;
import com.teamit.server.domain.post.repository.PostRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private final PostApplicationRepository applicationRepository;
    private final TeamInvitationRepository invitationRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;

    // ──────────────────────────────────────────────────────────────
    // 지원하기 → DIRECT 채팅방 자동 생성
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public ApplyPostResponse apply(Long postId, Long applicantId, ApplyPostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        User applicant = userRepository.findById(applicantId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // 지원자 ↔ 모집글 작성자 간 DIRECT 채팅방 생성
        ChatRoom chatRoom = chatService.createDirectChatRoom(
                applicant.getId(), post.getOwner().getId());

        PostApplication application = applicationRepository.save(PostApplication.builder()
                .post(post)
                .applicant(applicant)
                .appealText(request.getAppealText())
                .status(ApplicationStatus.PENDING)
                .chatRoom(chatRoom)
                .build());

        return ApplyPostResponse.builder()
                .applicationId(application.getId())
                .status(application.getStatus().name())
                .chatRoomId(chatRoom.getId())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 팀 초대 → DIRECT 채팅방 자동 생성
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public InviteTeamResponse invite(Long postId, Long senderId, InviteTeamRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("초대자를 찾을 수 없습니다"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("수신자를 찾을 수 없습니다"));

        // 초대자 ↔ 수신자 간 DIRECT 채팅방 생성
        ChatRoom chatRoom = chatService.createDirectChatRoom(sender.getId(), receiver.getId());

        TeamInvitation invitation = invitationRepository.save(TeamInvitation.builder()
                .post(post)
                .sender(sender)
                .receiver(receiver)
                .message(request.getMessage())
                .status(InvitationStatus.PENDING)
                .chatRoom(chatRoom)
                .build());

        return InviteTeamResponse.builder()
                .invitationId(invitation.getId())
                .status(invitation.getStatus().name())
                .chatRoomId(chatRoom.getId())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 매칭 수락 → GROUP 채팅방 자동 생성
    // type: "applications" | "invitations"
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public AcceptMatchingResponse accept(String type, Long id) {
        ChatRoom groupChat;

        if ("applications".equals(type)) {
            PostApplication application = applicationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("지원 정보를 찾을 수 없습니다"));
            application.accept();

            String teamName = application.getPost().getTitle() + " 팀";
            groupChat = chatService.createGroupChatRoom(teamName, List.of(
                    application.getApplicant().getId(),
                    application.getPost().getOwner().getId()
            ));

        } else if ("invitations".equals(type)) {
            TeamInvitation invitation = invitationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("초대 정보를 찾을 수 없습니다"));
            invitation.accept();

            String teamName = invitation.getPost().getTitle() + " 팀";
            groupChat = chatService.createGroupChatRoom(teamName, List.of(
                    invitation.getSender().getId(),
                    invitation.getReceiver().getId()
            ));

        } else {
            throw new IllegalArgumentException("type은 applications 또는 invitations 이어야 합니다");
        }

        return AcceptMatchingResponse.builder()
                .groupChatRoomId(groupChat.getId())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 매칭 거절
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void reject(String type, Long id) {
        if ("applications".equals(type)) {
            applicationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("지원 정보를 찾을 수 없습니다"))
                    .reject();
        } else if ("invitations".equals(type)) {
            invitationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("초대 정보를 찾을 수 없습니다"))
                    .reject();
        } else {
            throw new IllegalArgumentException("type은 applications 또는 invitations 이어야 합니다");
        }
    }
}
