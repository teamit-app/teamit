package com.teamit.server.domain.contest.dto;

import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.entity.ContestCategory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Set;

@Getter
@Builder
public class ContestDetailResponse {

    private Long contestId;
    private String title;
    private String organizer;
    private Set<ContestCategory> categories;
    private String target;
    private String recruitField;
    private String prize;
    private LocalDate startDate;
    private LocalDate endDate;
    private String linkUrl;
    private String content;
    private String imageUrl;
    private long dDay;

    public static ContestDetailResponse from(Contest contest) {
        LocalDate today = LocalDate.now();
        long dDay = ChronoUnit.DAYS.between(today, contest.getEndDate());
        return ContestDetailResponse.builder()
                .contestId(contest.getId())
                .title(contest.getTitle())
                .organizer(contest.getOrganizer())
                .categories(contest.getCategories())
                .target(contest.getTarget())
                .recruitField(contest.getRecruitField())
                .prize(contest.getPrize())
                .startDate(contest.getStartDate())
                .endDate(contest.getEndDate())
                .linkUrl(contest.getLinkUrl())
                .content(contest.getContent())
                .imageUrl(contest.getImageUrl())
                .dDay(dDay)
                .build();
    }
}
