package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.user.entity.AwardStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@NoArgsConstructor
public class AddContestCareerRequest {
    private String contestName;
    private List<String> roles;
    private LocalDate startDate;
    private LocalDate endDate;
    private AwardStatus awardStatus;
}
