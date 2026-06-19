package com.teamit.server.domain.chat.service;

import com.teamit.server.domain.chat.dto.*;
import com.teamit.server.domain.chat.entity.*;
import com.teamit.server.domain.chat.repository.*;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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

            String lastMessage = chatMessageRepository
                    .findTopByChatRoomIdOrderByCreatedAtDesc(room.getId())
                    .map(ChatMessage::getContent)
                    .orElse(null);

            java.time.LocalDateTime lastMessageAt = chatMessageRepository
                    .findTopByChatRoomIdOrderByCreatedAtDesc(room.getId())
                    .map(ChatMessage::getCreatedAt)
                    .orElse(null);

            long unreadCount = membership.getLastReadMessageId() == null
                    ? chatMessageRepository.countByChatRoomId(room.getId())
                    : chatMessageRepository.countByChatRoomIdAndIdGreaterThan(
                            room.getId(), membership.getLastReadMessageId());

            if (room.getRoomType() == RoomType.GROUP) {
                long memberCount = chatRoomMemberRepository.countByChatRoomId(room.getId());
                groupChats.add(GroupChatRoomResponse.builder()
                        .chatRoomId(room.getId())
                        .roomType("GROUP")
                        .teamName(room.getTeamName())
                        .memberCount(memberCount)
                        .lastMessage(lastMessage)
                        .lastMessageAt(lastMessageAt)
                        .unreadCount(unreadCount)
                        .build());
            } else {
                // DIRECT: 상대방 닉네임
                String opponentNickname = chatRoomMemberRepository.findByChatRoomId(room.getId())
                        .stream()
                        .filter(m -> !m.getUser().getId().equals(userId))
                        .findFirst()
                        .map(m -> m.getUser().getNickname())
                        .orElse(null);

                directChats.add(DirectChatRoomResponse.builder()
                        .chatRoomId(room.getId())
                        .roomType("DIRECT")
                        .opponentNickname(opponentNickname)
                        .lastMessage(lastMessage)
                        .lastMessageAt(lastMessageAt)
                        .unreadCount(unreadCount)
                        .build());
            }
        }

        return ChatRoomListResponse.builder()
                .groupChats(groupChats)
                .directChats(directChats)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 메시지 목록 조회 (최신순 페이징)
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ChatMessagePageResponse getMessages(Long chatRoomId, Long userId, int page, int size) {
        Page<ChatMessage> messagePage = chatMessageRepository
                .findByChatRoomIdOrderByCreatedAtDesc(chatRoomId, PageRequest.of(page, size));

        Long lastReadMessageId = chatRoomMemberRepository
                .findByUserIdAndChatRoomId(userId, chatRoomId)
                .map(ChatRoomMember::getLastReadMessageId)
                .orElse(null);

        List<ChatMessageResponse> content = messagePage.getContent().stream()
                .map(msg -> ChatMessageResponse.from(msg, lastReadMessageId))
                .collect(Collectors.toList());

        return ChatMessagePageResponse.builder()
                .content(content)
                .totalElements(messagePage.getTotalElements())
                .currentPage(messagePage.getNumber())
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

        ChatMessage message = chatMessageRepository.save(ChatMessage.builder()
                .chatRoom(chatRoom)
                .sender(sender)
                .content(request.getContent())
                .build());

        // 발신자의 lastReadMessageId 업데이트 — 본인이 보낸 메시지는 읽음 처리
        chatRoomMemberRepository.findByUserIdAndChatRoomId(request.getSenderId(), chatRoomId)
                .ifPresent(member -> {
                    member.updateLastRead(message.getId());
                    chatRoomMemberRepository.save(member);
                });

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
        chatRoomMemberRepository.delete(member);
    }

    // ──────────────────────────────────────────────────────────────
    // 1:1 채팅방 조회 또는 생성 (제안하기 버튼에서 호출)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public DirectChatRoomIdResponse getOrCreateDirectChatRoom(Long userId, Long targetUserId) {
        // 이미 채팅방이 있으면 재사용
        Optional<Long> existingId = chatRoomMemberRepository
                .findDirectChatRoomId(userId, targetUserId, RoomType.DIRECT);
        if (existingId.isPresent()) {
            return DirectChatRoomIdResponse.builder().chatRoomId(existingId.get()).build();
        }

        ChatRoom chatRoom = createDirectChatRoom(userId, targetUserId);
        return DirectChatRoomIdResponse.builder().chatRoomId(chatRoom.getId()).build();
    }

    // ──────────────────────────────────────────────────────────────
    // 내부 공통: DIRECT 채팅방 생성 (matching 서비스에서 호출)
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
    // 내부 공통: GROUP 채팅방 생성 (매칭 수락 시 호출)
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
}
