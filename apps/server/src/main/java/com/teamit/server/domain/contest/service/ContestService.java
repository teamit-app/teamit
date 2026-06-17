package com.teamit.server.domain.contest.service;

import com.teamit.server.domain.contest.dto.PopularContestListResponse;
import com.teamit.server.domain.contest.dto.PopularContestResponse;
import com.teamit.server.domain.contest.repository.ContestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContestService {

    private final ContestRepository contestRepository;

    @Transactional(readOnly = true)
    public PopularContestListResponse getPopularContests() {
        LocalDate today = LocalDate.now();
        List<PopularContestResponse> contests = contestRepository
                .findByEndDateGreaterThanEqualOrderByCreatedAtDesc(today)
                .stream()
                .map(PopularContestResponse::from)
                .collect(Collectors.toList());
        return PopularContestListResponse.builder()
                .contests(contests)
                .build();
    }
}
