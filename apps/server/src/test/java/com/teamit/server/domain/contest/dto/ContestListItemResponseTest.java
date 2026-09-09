package com.teamit.server.domain.contest.dto;

import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.entity.ContestCategory;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ContestListItemResponseTest {

    @Test
    void 조회수와_하트수가_응답에_그대로_매핑된다() {
        Contest contest = Contest.builder()
                .title("2026 Big Data 활용 대회")
                .organizer("teamit")
                .categories(Set.of(ContestCategory.IT))
                .endDate(LocalDate.now().plusDays(10))
                .build();
        // Contest.viewCount 필드 기본값(0)을 그대로 씀 — 세터가 없으므로 리플렉션 없이
        // 엔티티 생성 시점 기본값으로 매핑 확인
        ContestListItemResponse response = ContestListItemResponse.from(contest, 7L);

        assertThat(response.getHeartCount()).isEqualTo(7L);
        assertThat(response.getViewCount()).isEqualTo(0);
    }
}
