package com.teamit.server.domain.contest.service;

import com.teamit.server.domain.contest.dto.*;
import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.entity.ContestCategory;
import com.teamit.server.domain.contest.entity.ContestHeart;
import com.teamit.server.domain.contest.entity.ContestStatus;
import com.teamit.server.domain.contest.repository.ContestHeartRepository;
import com.teamit.server.domain.contest.repository.ContestRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContestService {

    private final ContestRepository contestRepository;
    private final ContestHeartRepository contestHeartRepository;
    private final UserRepository userRepository;

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

    @Transactional(readOnly = true)
    public ContestPageResponse getContestList(ContestCategory category, ContestStatus status, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        String categoryStr = category != null ? category.name() : null;

        LocalDate today = LocalDate.now();
        LocalDate statusEndMin = null;
        LocalDate statusEndMax = null;
        LocalDate statusEndBefore = null;

        if (status != null) {
            switch (status) {
                case ONGOING -> statusEndMin = today.plusDays(8);
                case DEADLINE_SOON -> {
                    statusEndMin = today;
                    statusEndMax = today.plusDays(7);
                }
                case CLOSED -> statusEndBefore = today;
            }
        }

        Page<Contest> contestPage = contestRepository.findContestList(
                categoryStr, statusEndMin, statusEndMax, statusEndBefore, keyword, pageable);

        List<ContestListItemResponse> content = contestPage.getContent().stream()
                .map(ContestListItemResponse::from)
                .collect(Collectors.toList());

        return ContestPageResponse.builder()
                .content(content)
                .totalElements(contestPage.getTotalElements())
                .totalPages(contestPage.getTotalPages())
                .currentPage(contestPage.getNumber())
                .build();
    }

    @Transactional
    public void addContestHeart(Long userId, Long contestId) {
        if (contestHeartRepository.existsByUserIdAndContestId(userId, contestId)) {
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("공모전을 찾을 수 없습니다"));

        contestHeartRepository.save(ContestHeart.builder()
                .user(user)
                .contest(contest)
                .build());
    }

    @Transactional
    public void removeContestHeart(Long userId, Long contestId) {
        contestHeartRepository.findByUserIdAndContestId(userId, contestId)
                .ifPresent(contestHeartRepository::delete);
    }

    @Transactional(readOnly = true)
    public HeartedContestListResponse getHeartedContests(Long userId) {
        List<HeartedContestResponse> content = contestHeartRepository.findAllByUserId(userId).stream()
                .map(heart -> HeartedContestResponse.from(heart.getContest()))
                .collect(Collectors.toList());

        return HeartedContestListResponse.builder()
                .content(content)
                .build();
    }
}
