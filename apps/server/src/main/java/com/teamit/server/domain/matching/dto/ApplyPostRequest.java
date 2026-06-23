package com.teamit.server.domain.matching.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplyPostRequest {
    // userId는 JWT에서 추출 — 요청 바디에서 제거
    private String appealText;
}
