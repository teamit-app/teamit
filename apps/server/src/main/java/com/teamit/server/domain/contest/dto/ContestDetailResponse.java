package com.teamit.server.domain.contest.dto;

import com.teamit.server.domain.contest.entity.Contest;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Getter
@Builder
public class ContestDetailResponse {

    private Long contestId;
    private String title;
    private String organizer;
    private String category;
    private String endDate;
    private long dDay;
    private boolean isNew;
    private String targetAudience;
    private String fields;
    private String prizeScale;
    private String registrationPeriod;
    private String registrationUrl;

    public static ContestDetailResponse from(Contest contest) {
        LocalDate today = LocalDate.now();
        long dDay = ChronoUnit.DAYS.between(today, contest.getEndDate());
        boolean isNew = contest.getCreatedAt() != null &&
                ChronoUnit.DAYS.between(contest.getCreatedAt().toLocalDate(), today) <= 7;

        String period = "";
        if (contest.getStartDate() != null) {
            period = contest.getStartDate() + " ~ " + contest.getEndDate();
        }

        return ContestDetailResponse.builder()
                .contestId(contest.getId())
                .title(contest.getTitle())
                .organizer(contest.getOrganizer())
                .category(contest.getCategory().name())
                .endDate(contest.getEndDate().toString())
                .dDay(dDay)
                .isNew(isNew)
                .targetAudience(contest.getTarget() != null ? contest.getTarget() : "")
                .fields(contest.getRecruitField() != null ? contest.getRecruitField() : "")
                .prizeScale(contest.getPrize() != null ? contest.getPrize() : "")
                .registrationPeriod(period)
                .registrationUrl(contest.getLinkUrl() != null ? contest.getLinkUrl() : "")
                .build();
    }
}
