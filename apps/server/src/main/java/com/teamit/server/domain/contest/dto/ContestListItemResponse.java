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
    private String imageUrl;
    // 탐색 탭 "인기순" 정렬은 목록을 한 번만 불러와 클라이언트에서 필터링·정렬하는
    // 구조라(useExploreData.ts), 정렬에 쓸 좋아요 수를 목록 응답에 같이 내려준다.
    private long heartCount;

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
                .category(contest.getCategory())
                .endDate(contest.getEndDate())
                .dDay(dDay)
                .isNew(isNew)
                .imageUrl(contest.getImageUrl())
                .heartCount(heartCount)
                .build();
    }
}
