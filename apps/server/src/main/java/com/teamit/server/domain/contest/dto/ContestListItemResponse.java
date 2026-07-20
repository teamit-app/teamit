package com.teamit.server.domain.contest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.entity.ContestCategory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Getter
@Builder
public class ContestListItemResponse {

    private Long contestId;
    private String title;
    private String organizer;
    private ContestCategory category;
    private LocalDate endDate;
    private long dDay;
    @JsonProperty("isNew")
    private boolean isNew;

    public static ContestListItemResponse from(Contest contest) {
        LocalDate today = LocalDate.now();
        long dDay = ChronoUnit.DAYS.between(today, contest.getEndDate());
        boolean isNew = contest.getCreatedAt() != null &&
                ChronoUnit.DAYS.between(contest.getCreatedAt().toLocalDate(), today) <= 7;
        return ContestListItemResponse.builder()
                .contestId(contest.getId())
                .title(contest.getTitle())
                .organizer(contest.getOrganizer())
                .category(contest.getCategory())
                .endDate(contest.getEndDate())
                .dDay(dDay)
                .isNew(isNew)
                .build();
    }
}
