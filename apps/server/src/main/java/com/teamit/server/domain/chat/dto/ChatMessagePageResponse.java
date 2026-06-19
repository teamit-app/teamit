package com.teamit.server.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ChatMessagePageResponse {
    private List<ChatMessageResponse> content;
    private long totalElements;
    private int currentPage;
}
