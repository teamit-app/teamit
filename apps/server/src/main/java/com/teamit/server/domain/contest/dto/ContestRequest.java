package com.teamit.server.domain.contest.dto;

import com.teamit.server.domain.contest.entity.ContestCategory;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// 관리자 공모전 등록/수정 공용 요청 (AdminContestController)
@Getter
@NoArgsConstructor
public class ContestRequest {
    private String title;
    private String organizer;
    private ContestCategory category;
    private String target;
    private String recruitField;
    private String prize;
    private LocalDate startDate;
    private LocalDate endDate;
    private String linkUrl;
    private String content;
    private String imageUrl;
}
