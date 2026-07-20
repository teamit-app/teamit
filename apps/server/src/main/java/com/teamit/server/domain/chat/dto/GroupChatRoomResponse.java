package com.teamit.server.domain.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class GroupChatRoomResponse {
    private Long chatRoomId;
    private String roomType;
    private String teamName;
    private long memberCount;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;

    // teamInfo 필드
    private Long postId;
    private String postTitle;
    private Long contestId;
    private String contestTitle;
    private Integer dDay;
    // 공모전 마감일이 지났는지 (리뷰 작성 개방 조건) — 팀 확정 여부와는 별개
    @JsonProperty("isExpired")
    private boolean isExpired;
    // 모집자가 팀원을 확정했는지 (팀 현황 UI에서 "팀원 확정" 표시용)
    private boolean teamConfirmed;
    private int currentCount;
    private int totalCount;
    private List<TeamMemberInfo> members;
    private String statusLabel;
}
