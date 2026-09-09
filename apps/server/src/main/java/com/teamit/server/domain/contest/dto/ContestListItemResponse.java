package com.teamit.server.domain.contest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.entity.ContestCategory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Set;

@Getter
@Builder
public class ContestListItemResponse {

    private Long contestId;
    private String title;
    private String organizer;
    private Set<ContestCategory> categories;
    private LocalDate endDate;
    private long dDay;
    @JsonProperty("isNew")
    private boolean isNew;
    private String imageUrl;
    // 카드에 좋아요 수를 표시하기 위해 목록 응답에 같이 내려준다(실제 정렬은 서버가
    // ContestSpecifications.orderByPopularity()로 처리, 이 값은 표시용).
    private long heartCount;
    private int viewCount;

    public static ContestListItemResponse from(Contest contest) {
        return from(contest, 0L);
    }

    public static ContestListItemResponse from(Contest contest, long heartCount) {
        LocalDate today = LocalDate.now();
        long dDay = ChronoUnit.DAYS.between(today, contest.getEndDate());
        boolean isNew = contest.getCreatedAt() != null &&
                ChronoUnit.DAYS.between(contest.getCreatedAt().toLocalDate(), today) <= 7;
        return ContestListItemResponse.builder()
                .contestId(contest.getId())
                .title(contest.getTitle())
                .organizer(contest.getOrganizer())
                .categories(contest.getCategories())
                .endDate(contest.getEndDate())
                .dDay(dDay)
                .isNew(isNew)
                .imageUrl(contest.getImageUrl())
                .heartCount(heartCount)
                .viewCount(contest.getViewCount())
                .build();
    }
}
