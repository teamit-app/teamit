package com.teamit.server.domain.chat.service;

import com.teamit.server.domain.chat.dto.*;
import com.teamit.server.domain.chat.entity.*;
import com.teamit.server.domain.chat.repository.*;
import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.repository.ContestRepository;
import com.teamit.server.domain.matching.entity.TeamInvitation;
import com.teamit.server.domain.matching.repository.TeamInvitationRepository;
import com.teamit.server.domain.post.entity.Post;
import com.teamit.server.domain.post.repository.PostRepository;
import com.teamit.server.domain.review.repository.TeamReviewRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ContestRepository contestRepository;
    private final TeamInvitationRepository teamInvitationRepository;
    private final TeamReviewRepository teamReviewRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ──────────────────────────────────────────────────────────────
    // 채팅방 목록 조회: GROUP / DIRECT 분리
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ChatRoomListResponse getChatRooms(Long userId) {
        List<ChatRoomMember> memberships = chatRoomMemberRepository.findByUserId(userId);

        List<GroupChatRoomResponse> groupChats = new ArrayList<>();
        List<DirectChatRoomResponse> directChats = new ArrayList<>();

        for (ChatRoomMember membership : memberships) {
            ChatRoom room = membership.getChatRoom();

            // 나갔다가 재입장하면 joinedAt이 새로 갱신되므로, 그 이전 메시지는 마지막 메시지
            // 미리보기·안읽음 수 계산에서 전부 제외한다 (이전 대화 내역이 보이면 안 되므로)
            Optional<ChatMessage> lastMessageOpt = chatMessageRepository
                    .findTopByChatRoomIdAndCreatedAtAfterOrderByCreatedAtDesc(room.getId(), membership.getJoinedAt());
            String lastMessage = lastMessageOpt.map(ChatMessage::getContent).orElse(null);
            java.time.LocalDateTime lastMessageAt = lastMessageOpt.map(ChatMessage::getCreatedAt).orElse(null);

            long unreadCount = membership.getLastReadMessageId() == null
                    ? chatMessageRepository.countByChatRoomIdAndCreatedAtAfter(room.getId(), membership.getJoinedAt())
                    : chatMessageRepository.countByChatRoomIdAndIdGreaterThan(
                            room.getId(), membership.getLastReadMessageId());

            if (room.getRoomType() == RoomType.GROUP) {
                groupChats.add(buildGroupChatRoomResponse(room, unreadCount, lastMessage, lastMessageAt));
            } else {
                Optional<User> opponent = chatRoomMemberRepository.findByChatRoomId(room.getId())
                        .stream()
                        .map(ChatRoomMember::getUser)
                        .filter(u -> !u.getId().equals(userId))
                        .findFirst();

                directChats.add(DirectChatRoomResponse.builder()
                        .chatRoomId(room.getId())
                        .roomType("DIRECT")
                        .opponentUserId(opponent.map(User::getId).orElse(null))
                        .opponentNickname(opponent.map(User::getNickname).orElse(null))
                        .lastMessage(lastMessage)
                        .lastMessageAt(lastMessageAt)
                        .unreadCount(unreadCount)
                        .build());
            }
        }

        // 가장 최근에 메시지가 온 채팅방이 위로 오도록 정렬 (메시지 없는 방은 맨 아래)
        groupChats.sort(Comparator.comparing(
                GroupChatRoomResponse::getLastMessageAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        directChats.sort(Comparator.comparing(
                DirectChatRoomResponse::getLastMessageAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        return ChatRoomListResponse.builder()
                .groupChats(groupChats)
                .directChats(directChats)
                .build();
    }

    private GroupChatRoomResponse buildGroupChatRoomResponse(
            ChatRoom room, long unreadCount, String lastMessage,
            java.time.LocalDateTime lastMessageAt) {

        List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoomId(room.getId());
        int currentCount = members.size();

        // Post 조회 → teamInfo 구성
        Optional<Post> postOpt = postRepository.findByChatRoomId(room.getId());

        Long postId = null;
        String postTitle = null;
        Long contestId = null;
        String contestTitle = null;
        Integer dDay = null;
        boolean isExpired = false;
        boolean teamConfirmed = false;
        int totalCount = currentCount;
        List<TeamMemberInfo> memberInfos = new ArrayList<>();
        String statusLabel = "팀원 모집 중";

        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            postId = post.getId();
            postTitle = post.getTitle();
            teamConfirmed = post.isTeamConfirmed();
            totalCount = post.getRecruitCount() != null ? post.getRecruitCount() + 1 : currentCount;
            memberInfos = getTeamMembers(post);

            statusLabel = teamConfirmed
                    ? "팀원 확정"
                    : currentCount + "/" + totalCount + "명 참여 중";

            // 공모전 마감일로 dDay 계산 + 배너용 공모전 정보
            // isExpired(리뷰 작성 개방 조건)는 팀 확정 여부가 아니라 실제 공모전 마감일이 지났는지로 판단
            if (post.getContestId() != null) {
                Optional<Contest> contestOpt = contestRepository.findById(post.getContestId());
                if (contestOpt.isPresent()) {
                    Contest contest = contestOpt.get();
                    contestId = contest.getId();
                    contestTitle = contest.getTitle();
                    long days = ChronoUnit.DAYS.between(LocalDate.now(), contest.getEndDate());
                    dDay = (int) days;
                    isExpired = days < 0;
                }
            }
        }

        return GroupChatRoomResponse.builder()
                .chatRoomId(room.getId())
                .roomType("GROUP")
                .teamName(room.getTeamName())
                .memberCount(currentCount)
                .lastMessage(lastMessage)
                .lastMessageAt(lastMessageAt)
                .unreadCount(unreadCount)
                .postId(postId)
                .postTitle(postTitle)
                .contestId(contestId)
                .contestTitle(contestTitle)
                .dDay(dDay)
                .isExpired(isExpired)
                .teamConfirmed(teamConfirmed)
                .currentCount(currentCount)
                .totalCount(totalCount)
                .members(memberInfos)
                .statusLabel(statusLabel)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 모집글 기준 팀원 목록 조회 (실제 멤버 + 모집 중인 빈 슬롯)
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<TeamMemberInfo> getTeamMembers(Post post) {
        List<ChatRoomMember> members = post.getChatRoomId() != null
                ? chatRoomMemberRepository.findByChatRoomId(post.getChatRoomId())
                : List.of();
        int currentCount = members.size();
        int totalCount = post.getRecruitCount() != null ? post.getRecruitCount() + 1 : currentCount;

        List<TeamMemberInfo> memberInfos = new ArrayList<>();
        for (ChatRoomMember m : members) {
            memberInfos.add(TeamMemberInfo.builder()
                    .id(m.getUser().getId())
                    .name(m.getUser().getNickname())
                    .realName(m.getUser().getName())
                    .isHost(m.getUser().getId().equals(post.getOwner().getId()))
                    .filled(true)
                    .build());
        }
        for (int i = currentCount; i < totalCount; i++) {
            memberInfos.add(TeamMemberInfo.builder()
                    .name("모집 중")
                    .isHost(false)
                    .filled(false)
                    .build());
        }
        return memberInfos;
    }

    // ──────────────────────────────────────────────────────────────
    // 모집글 기준 현재 실제 팀원 수 (모집자 포함)
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public int getCurrentMemberCount(Post post) {
        return post.getChatRoomId() != null
                ? (int) chatRoomMemberRepository.countByChatRoomId(post.getChatRoomId())
                : 0;
    }

    // ──────────────────────────────────────────────────────────────
    // 메시지 목록 조회 (최신순 페이징)
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ChatMessagePageResponse getMessages(Long chatRoomId, Long userId, int page, int size) {
        Optional<ChatRoomMember> membership = chatRoomMemberRepository
                .findByUserIdAndChatRoomId(userId, chatRoomId);

        // 나갔다가 재입장하면 joinedAt이 새로 갱신되므로, 그 이전 대화 내역은 보이면 안 된다
        Page<ChatMessage> messagePage = membership
                .map(m -> chatMessageRepository.findByChatRoomIdAndCreatedAtAfterOrderByCreatedAtDesc(
                        chatRoomId, m.getJoinedAt(), PageRequest.of(page, size)))
                .orElseGet(() -> chatMessageRepository
                        .findByChatRoomIdOrderByCreatedAtDesc(chatRoomId, PageRequest.of(page, size)));

        Long lastReadMessageId = membership
                .map(ChatRoomMember::getLastReadMessageId)
                .orElse(null);

        List<ChatMessageResponse> content = messagePage.getContent().stream()
                .map(msg -> buildMessageResponse(msg, lastReadMessageId))
                .collect(Collectors.toList());

        return ChatMessagePageResponse.builder()
                .content(content)
                .totalElements(messagePage.getTotalElements())
                .currentPage(messagePage.getNumber())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 채팅방 읽음 처리 — 지금까지는 sendMessage에서 "내가 보낸 메시지까지"만
    // lastReadMessageId를 갱신했고, 그냥 열어서 읽기만 한 경우엔 갱신할 방법이 아예 없었다
    // (모바일이 세션 로컬 상태로만 "읽음"을 흉내내다보니 재로그인하면 다시 안읽음으로
    // 보이거나, 반대로 그 이후 새 메시지가 와도 계속 읽음으로 보이는 버그의 원인이었음)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void markAsRead(Long chatRoomId, Long userId) {
        ChatRoomMember member = chatRoomMemberRepository
                .findByUserIdAndChatRoomId(userId, chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방 멤버가 아닙니다"));

        chatMessageRepository.findTopByChatRoomIdOrderByCreatedAtDesc(chatRoomId)
                .ifPresent(latest -> member.updateLastRead(latest.getId()));
    }

    // INVITATION_CARD 메시지는 발송 시점이 아니라 조회 시점 기준 최신 인원수로 조립한다
    // (지원카드 등 다른 화면과 동일하게 항상 실시간 값을 보여주기 위함)
    private ChatMessageResponse buildMessageResponse(ChatMessage msg, Long lastReadMessageId) {
        ChatMessageResponse base = ChatMessageResponse.from(msg, lastReadMessageId);
        if (msg.getMessageType() != MessageType.INVITATION_CARD || msg.getReferenceId() == null) {
            return base;
        }

        Optional<TeamInvitation> invitationOpt = teamInvitationRepository.findById(msg.getReferenceId());
        if (invitationOpt.isEmpty()) {
            return base;
        }

        TeamInvitation invitation = invitationOpt.get();
        Post post = invitation.getPost();
        int totalCount = post.getRecruitCount() != null ? post.getRecruitCount() + 1 : 0;
        int currentCount = getCurrentMemberCount(post);
        String contestName = post.getContestId() != null
                ? contestRepository.findById(post.getContestId()).map(Contest::getTitle).orElse("")
                : "";

        return ChatMessageResponse.builder()
                .messageId(base.getMessageId())
                .senderId(base.getSenderId())
                .senderNickname(base.getSenderNickname())
                .content("")
                .isRead(base.isRead())
                .isSystem(false)
                .createdAt(base.getCreatedAt())
                .invitationCard(ChatMessageResponse.InvitationCardInfo.builder()
                        .title(post.getTitle())
                        .currentMembers(currentCount)
                        .totalMembers(totalCount)
                        .contestName(contestName)
                        .senderName(invitation.getSender().getNickname())
                        .postId(post.getId())
                        .invitationId(invitation.getId())
                        .build())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 메시지 전송
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public SendMessageResponse sendMessage(Long chatRoomId, SendMessageRequest request) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다"));
        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        ChatMessage message = chatMessageRepository.save(ChatMessage.text(chatRoom, sender, request.getContent()));

        chatRoomMemberRepository.findByUserIdAndChatRoomId(request.getSenderId(), chatRoomId)
                .ifPresent(member -> {
                    member.updateLastRead(message.getId());
                    chatRoomMemberRepository.save(member);
                });

        // 이 채팅방을 열어둔 다른 멤버들에게 새로고침 없이 즉시 보이도록 push
        messagingTemplate.convertAndSend(
                "/topic/chatroom/" + chatRoomId, ChatMessageResponse.from(message, null));

        return SendMessageResponse.builder()
                .messageId(message.getId())
                .createdAt(message.getCreatedAt())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 채팅방 나가기
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void leaveChatRoom(Long chatRoomId, Long userId) {
        ChatRoomMember member = chatRoomMemberRepository
                .findByUserIdAndChatRoomId(userId, chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방 멤버가 아닙니다"));
        ChatRoom chatRoom = member.getChatRoom();
        User user = member.getUser();

        // 1:1 채팅방은 아예 나갈 수 없다 — 나가면 상대방 화면에서 내 정보(닉네임)가 사라지고
        // 상대가 이후 보낸 메시지를 내가 영영 못 받게 되는 문제가 있어, 애초에 막는다
        // (그룹 채팅방은 팀이 계속 남아있어 한 명이 나가도 문제가 없으므로 그대로 하드 삭제)
        if (chatRoom.getRoomType() == RoomType.DIRECT) {
            throw new IllegalStateException("1:1 채팅방은 나갈 수 없습니다");
        }

        chatRoomMemberRepository.delete(member);
        chatMessageRepository.save(ChatMessage.system(chatRoom, user, user.getNickname() + "님이 나갔습니다"));
    }

    // ──────────────────────────────────────────────────────────────
    // 채팅방 삭제 (GROUP 채팅방 삭제 시 PostService에서 호출)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void deleteChatRoom(Long chatRoomId) {
        // team_reviews.chat_room_id가 FK로 걸려 있어 먼저 지우지 않으면 chat_rooms 삭제 시
        // DataIntegrityViolationException이 난다 — 다만 리뷰는 영구 평판 데이터로 계속
        // 집계돼야 하므로 레코드를 삭제하지 않고 참조만 끊는다(detach)
        teamReviewRepository.detachChatRoom(chatRoomId);
        chatMessageRepository.deleteAllByChatRoomId(chatRoomId);
        chatRoomMemberRepository.deleteAllByChatRoomId(chatRoomId);
        chatRoomRepository.deleteById(chatRoomId);
    }

    // 채팅방 멤버들의 userId 목록 (삭제 전 알림 대상 확보용)
    @Transactional(readOnly = true)
    public List<Long> getMemberUserIds(Long chatRoomId) {
        return chatRoomMemberRepository.findByChatRoomId(chatRoomId).stream()
                .map(m -> m.getUser().getId())
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────
    // 1:1 채팅방 조회 또는 생성
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public DirectChatRoomIdResponse getOrCreateDirectChatRoom(Long userId, Long targetUserId) {
        ChatRoom chatRoom = findOrCreateDirectChatRoom(userId, targetUserId);
        return DirectChatRoomIdResponse.builder().chatRoomId(chatRoom.getId()).build();
    }

    // 이미 두 유저 간 DIRECT 채팅방이 있으면 재사용, 없으면 새로 생성
    // (지원하기/팀 초대 등 여러 곳에서 "이미 나눈 1:1 채팅"을 중복 생성하지 않도록 공용으로 사용)
    @Transactional
    public ChatRoom findOrCreateDirectChatRoom(Long userId1, Long userId2) {
        return chatRoomMemberRepository
                .findDirectChatRoomId(userId1, userId2, RoomType.DIRECT)
                .flatMap(chatRoomRepository::findById)
                .orElseGet(() -> createDirectChatRoom(userId1, userId2));
    }

    // ──────────────────────────────────────────────────────────────
    // 내부 공통: DIRECT 채팅방 생성
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public ChatRoom createDirectChatRoom(Long userId1, Long userId2) {
        ChatRoom chatRoom = chatRoomRepository.save(ChatRoom.builder()
                .roomType(RoomType.DIRECT)
                .build());

        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(chatRoom).user(user1).build());
        chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(chatRoom).user(user2).build());

        return chatRoom;
    }

    // ──────────────────────────────────────────────────────────────
    // 내부 공통: GROUP 채팅방 생성 (모집글 생성 시 호출)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public ChatRoom createGroupChatRoom(String teamName, List<Long> userIds) {
        ChatRoom chatRoom = chatRoomRepository.save(ChatRoom.builder()
                .roomType(RoomType.GROUP)
                .teamName(teamName)
                .build());

        for (Long userId : userIds) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
            chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(chatRoom).user(user).build());
        }

        return chatRoom;
    }

    // ──────────────────────────────────────────────────────────────
    // 내부 공통: GROUP 채팅방에 멤버 추가 (매칭 수락 시 호출)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void addMemberToGroupChatRoom(Long chatRoomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        boolean alreadyMember = chatRoomMemberRepository
                .findByUserIdAndChatRoomId(userId, chatRoomId).isPresent();
        if (!alreadyMember) {
            chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(chatRoom).user(user).build());
            chatMessageRepository.save(ChatMessage.system(chatRoom, user, user.getNickname() + "님이 입장했습니다"));
        }
    }

    // ──────────────────────────────────────────────────────────────
    // 팀 초대 전송 시 1:1 채팅방에 인사말 + 초대장 카드 메시지 자동 발송
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void sendInvitationMessages(ChatRoom chatRoom, User sender, User receiver, Long invitationId) {
        chatMessageRepository.save(ChatMessage.text(
                chatRoom, sender, sender.getNickname() + "님이 " + receiver.getNickname() + "님을 팀에 초대하셨어요! 🎉"));
        chatMessageRepository.save(ChatMessage.invitationCard(chatRoom, sender, "", invitationId));
    }
}
