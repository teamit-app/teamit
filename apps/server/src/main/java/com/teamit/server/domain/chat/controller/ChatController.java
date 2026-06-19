package com.teamit.server.domain.chat.controller;

import com.teamit.server.domain.chat.dto.*;
import com.teamit.server.domain.chat.service.ChatService;
import com.teamit.server.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Chat", description = "채팅 API")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @Operation(summary = "채팅방 목록 조회", description = "GROUP(단체)과 DIRECT(1:1) 채팅방을 분리해서 반환합니다.")
    @GetMapping("/users/{userId}/chat-rooms")
    public ApiResponse<ChatRoomListResponse> getChatRooms(@PathVariable Long userId) {
        ChatRoomListResponse response = chatService.getChatRooms(userId);
        return ApiResponse.success(response, "채팅방 목록 조회 성공");
    }

    @Operation(summary = "채팅 메시지 조회", description = "최신순 페이징으로 메시지를 조회합니다. userId를 전달하면 읽음 여부(isRead)가 계산됩니다.")
    @GetMapping("/chat-rooms/{chatRoomId}/messages")
    public ApiResponse<ChatMessagePageResponse> getMessages(
            @PathVariable Long chatRoomId,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        ChatMessagePageResponse response = chatService.getMessages(chatRoomId, userId, page, size);
        return ApiResponse.success(response, "메시지 조회 성공");
    }

    @Operation(summary = "채팅방 나가기")
    @DeleteMapping("/chat-rooms/{chatRoomId}/members/{userId}")
    public ApiResponse<Void> leaveChatRoom(
            @PathVariable Long chatRoomId,
            @PathVariable Long userId) {
        chatService.leaveChatRoom(chatRoomId, userId);
        return ApiResponse.success(null, "채팅방에서 나갔습니다");
    }

    @Operation(summary = "1:1 채팅방 조회 또는 생성", description = "상대방과의 DIRECT 채팅방이 이미 있으면 반환하고, 없으면 새로 만듭니다.")
    @PostMapping("/users/{userId}/chat-rooms/direct")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DirectChatRoomIdResponse> getOrCreateDirectChatRoom(
            @PathVariable Long userId,
            @RequestParam Long targetUserId) {
        DirectChatRoomIdResponse response = chatService.getOrCreateDirectChatRoom(userId, targetUserId);
        return ApiResponse.success(response, "채팅방이 준비되었습니다");
    }

    @Operation(summary = "메시지 전송", description = "채팅방에 메시지를 전송합니다.")
    @PostMapping("/chat-rooms/{chatRoomId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SendMessageResponse> sendMessage(
            @PathVariable Long chatRoomId,
            @RequestBody SendMessageRequest request) {
        SendMessageResponse response = chatService.sendMessage(chatRoomId, request);
        return ApiResponse.success(response, "메시지가 전송되었습니다");
    }
}
