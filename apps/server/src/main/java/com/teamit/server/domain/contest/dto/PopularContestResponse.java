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
public class PopularContestResponse {

    private Long contestId;
    private String title;
    private String organizer;
    private Set<ContestCategory> categories;
    private LocalDate endDate;
    private long dDay;
    private String imageUrl;
    private long heartCount;
    private int viewCount;

    public static PopularContestResponse from(Contest contest, long heartCount) {
        long dDay = ChronoUnit.DAYS.between(LocalDate.now(), contest.getEndDate());
        return PopularContestResponse.builder()
                .contestId(contest.getId())
                .title(contest.getTitle())
                .organizer(contest.getOrganizer())
                .categories(contest.getCategories())
                .endDate(contest.getEndDate())
                .dDay(dDay)
                .imageUrl(contest.getImageUrl())
                .heartCount(heartCount)
                .viewCount(contest.getViewCount())
                .build();
    }
}
