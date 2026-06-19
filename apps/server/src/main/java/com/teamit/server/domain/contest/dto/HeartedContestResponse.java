package com.teamit.server.domain.contest.dto;

import com.teamit.server.domain.contest.entity.Contest;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Getter
@Builder
public class HeartedContestResponse {

    private Long contestId;
    private String title;
    private String organizer;
    private LocalDate endDate;
    private long dDay;

    public static HeartedContestResponse from(Contest contest) {
        long dDay = ChronoUnit.DAYS.between(LocalDate.now(), contest.getEndDate());
        return HeartedContestResponse.builder()
                .contestId(contest.getId())
                .title(contest.getTitle())
                .organizer(contest.getOrganizer())
                .endDate(contest.getEndDate())
                .dDay(dDay)
                .build();
    }
}
