package com.teamit.server.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ChatRoomListResponse {
    private List<GroupChatRoomResponse> groupChats;
    private List<DirectChatRoomResponse> directChats;
}
