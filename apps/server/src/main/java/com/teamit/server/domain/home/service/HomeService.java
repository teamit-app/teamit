package com.teamit.server.domain.home.service;

import com.teamit.server.domain.home.dto.MatchingStatusResponse;
import com.teamit.server.domain.home.repository.HomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HomeService {

    private final HomeRepository homeRepository;

    @Transactional(readOnly = true)
    public MatchingStatusResponse getMatchingStatus(Long userId) {
        long receivedInvitationCount = homeRepository.countPendingInvitations(userId);
        long appliedTeamCount = homeRepository.countApplications(userId);
        return MatchingStatusResponse.builder()
                .receivedInvitationCount(receivedInvitationCount)
                .appliedTeamCount(appliedTeamCount)
                .build();
    }
}
