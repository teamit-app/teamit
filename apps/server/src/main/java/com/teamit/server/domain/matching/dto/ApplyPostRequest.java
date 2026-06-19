package com.teamit.server.domain.matching.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplyPostRequest {
    private Long userId;
    private String appealText;
}
