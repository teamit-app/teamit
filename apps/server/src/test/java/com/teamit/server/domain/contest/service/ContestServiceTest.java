package com.teamit.server.domain.contest.service;

import com.teamit.server.domain.contest.dto.ContestSortOption;
import com.teamit.server.domain.contest.repository.ContestHeartRepository;
import com.teamit.server.domain.contest.repository.ContestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ContestServiceTest {

    @Mock
    private ContestRepository contestRepository;
    @Mock
    private ContestHeartRepository contestHeartRepository;

    @InjectMocks
    private ContestService contestService;

    // 버그였던 지점: "인기순"을 눌러도 최신순과 순서가 똑같았던 원인은 서버가 애초에
    // sort 파라미터 자체를 안 받고 항상 createdAt DESC로만 페이징했기 때문(프론트가 로드된
    // 페이지 안에서만 재정렬해서 하트수가 대부분 0(동점)이라 안정정렬로 순서가 안 바뀜).
    // ContestSpecifications.orderByPopularity()가 쿼리 안에서 직접 ORDER BY를 세팅하므로,
    // Pageable에 Sort를 같이 실으면 안 된다 — 그 배선이 맞는지 확인한다.
    @Test
    void 인기순_조회시_Pageable에는_Sort를_넘기지_않는다() {
        given(contestRepository.findAll(any(Specification.class), any(Pageable.class)))
                .willReturn(new PageImpl<>(List.of()));
        given(contestHeartRepository.countGroupedByContestIdIn(List.of())).willReturn(List.of());

        contestService.getContestList(null, null, null, ContestSortOption.POPULAR, 0, 10);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(contestRepository).findAll(any(Specification.class), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getSort().isUnsorted()).isTrue();
    }

    @Test
    void 최신순_조회시_생성일_내림차순_Sort를_넘긴다() {
        given(contestRepository.findAll(any(Specification.class), any(Pageable.class)))
                .willReturn(new PageImpl<>(List.of()));
        given(contestHeartRepository.countGroupedByContestIdIn(List.of())).willReturn(List.of());

        contestService.getContestList(null, null, null, ContestSortOption.LATEST, 0, 10);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(contestRepository).findAll(any(Specification.class), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getSort()).isEqualTo(Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
