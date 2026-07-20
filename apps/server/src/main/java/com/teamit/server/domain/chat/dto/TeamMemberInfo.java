package com.teamit.server.domain.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TeamMemberInfo {
    private Long id;       // null이면 빈 슬롯
    private String name;
    private String realName;  // 리뷰 작성 시 "닉네임(본명)"으로 표기하기 위한 실명 (빈 슬롯이면 null)
    @JsonProperty("isHost")
    private boolean isHost;
    private boolean filled;
}
