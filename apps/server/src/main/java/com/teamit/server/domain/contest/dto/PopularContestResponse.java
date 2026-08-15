package com.teamit.server.domain.contest.dto;

import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.entity.ContestCategory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Getter
@Builder
public class PopularContestResponse {

    private Long contestId;
    private String title;
    private String organizer;
    private ContestCategory category;
    private LocalDate endDate;
    private long dDay;
    private String imageUrl;

    public static PopularContestResponse from(Contest contest) {
        long dDay = ChronoUnit.DAYS.between(LocalDate.now(), contest.getEndDate());
        return PopularContestResponse.builder()
                .contestId(contest.getId())
                .title(contest.getTitle())
                .organizer(contest.getOrganizer())
                .category(contest.getCategory())
                .endDate(contest.getEndDate())
                .dDay(dDay)
                .imageUrl(contest.getImageUrl())
                .build();
    }
}
