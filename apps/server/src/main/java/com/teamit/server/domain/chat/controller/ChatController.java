package com.teamit.server.domain.chat.controller;

import com.teamit.server.domain.chat.dto.*;
import com.teamit.server.domain.chat.service.ChatService;
import com.teamit.server.domain.post.service.PostService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.CustomUserDetails;
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
    private final PostService postService;

    @Operation(summary = "채팅방 목록 조회", description = "GROUP(단체)과 DIRECT(1:1) 채팅방을 분리해서 반환합니다.")
    @GetMapping("/users/chat-rooms")
    public ApiResponse<ChatRoomListResponse> getChatRooms(
            @LoginUser CustomUserDetails userDetails) {
        ChatRoomListResponse response = chatService.getChatRooms(userDetails.getUserId());
        return ApiResponse.success(response, "채팅방 목록 조회 성공");
    }

    @Operation(summary = "채팅 메시지 조회", description = "최신순 페이징으로 메시지를 조회합니다.")
    @GetMapping("/chat-rooms/{chatRoomId}/messages")
    public ApiResponse<ChatMessagePageResponse> getMessages(
            @PathVariable Long chatRoomId,
            @LoginUser CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        ChatMessagePageResponse response = chatService.getMessages(chatRoomId, userDetails.getUserId(), page, size);
        return ApiResponse.success(response, "메시지 조회 성공");
    }

    @Operation(summary = "채팅방 읽음 처리", description = "이 채팅방의 최신 메시지까지 읽음으로 표시합니다.")
    @PatchMapping("/chat-rooms/{chatRoomId}/read")
    public ApiResponse<Void> markAsRead(
            @PathVariable Long chatRoomId,
            @LoginUser CustomUserDetails userDetails) {
        chatService.markAsRead(chatRoomId, userDetails.getUserId());
        return ApiResponse.success(null, "읽음 처리되었습니다");
    }

    @Operation(summary = "채팅방 나가기")
    @DeleteMapping("/chat-rooms/{chatRoomId}/leave")
    public ApiResponse<Void> leaveChatRoom(
            @PathVariable Long chatRoomId,
            @LoginUser CustomUserDetails userDetails) {
        chatService.leaveChatRoom(chatRoomId, userDetails.getUserId());
        return ApiResponse.success(null, "채팅방에서 나갔습니다");
    }

    @Operation(summary = "채팅방 삭제(방장 전용)", description = "GROUP 채팅방과 연결된 모집글을 함께 삭제합니다. 지원자·팀원에게 알림이 발송됩니다.")
    @DeleteMapping("/chat-rooms/{chatRoomId}")
    public ApiResponse<Void> deleteChatRoom(
            @PathVariable Long chatRoomId,
            @LoginUser CustomUserDetails userDetails) {
        postService.deletePostByChatRoom(chatRoomId, userDetails.getUserId());
        return ApiResponse.success(null, "채팅방과 모집글이 삭제되었습니다");
    }

    @Operation(summary = "1:1 채팅방 조회 또는 생성", description = "상대방과의 DIRECT 채팅방이 이미 있으면 반환하고, 없으면 새로 만듭니다.")
    @PostMapping("/users/chat-rooms/direct")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DirectChatRoomIdResponse> getOrCreateDirectChatRoom(
            @LoginUser CustomUserDetails userDetails,
            @RequestParam Long targetUserId) {
        DirectChatRoomIdResponse response = chatService.getOrCreateDirectChatRoom(userDetails.getUserId(), targetUserId);
        return ApiResponse.success(response, "채팅방이 준비되었습니다");
    }

    @Operation(summary = "메시지 전송", description = "채팅방에 메시지를 전송합니다.")
    @PostMapping("/chat-rooms/{chatRoomId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SendMessageResponse> sendMessage(
            @PathVariable Long chatRoomId,
            @LoginUser CustomUserDetails userDetails,
            @RequestBody SendMessageRequest request) {
        request.setSenderId(userDetails.getUserId());
        SendMessageResponse response = chatService.sendMessage(chatRoomId, request);
        return ApiResponse.success(response, "메시지가 전송되었습니다");
    }
}
