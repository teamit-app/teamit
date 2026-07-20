package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.user.entity.AwardStatus;
import com.teamit.server.domain.user.entity.Career;
import com.teamit.server.domain.user.entity.CareerType;
import lombok.Builder;
import lombok.Getter;

import java.util.Arrays;
import java.util.List;

@Getter
@Builder
public class CareerItemResponse {

    private Long careerItemId;
    private CareerType careerType;

    // 공모전 경력 필드
    private String contestName;
    private List<String> roles;
    private String startDate;
    private String endDate;
    private AwardStatus awardStatus;

    // 자격증 필드
    private String certName;
    private String issuingOrg;
    private String acquiredDate;

    public static CareerItemResponse from(Career career) {
        List<String> roles = (career.getRolesCsv() != null && !career.getRolesCsv().isBlank())
                ? Arrays.asList(career.getRolesCsv().split(","))
                : List.of();

        return CareerItemResponse.builder()
                .careerItemId(career.getId())
                .careerType(career.getCareerType())
                .contestName(career.getContestName())
                .roles(roles)
                .startDate(career.getStartDate() != null ? career.getStartDate().toString() : null)
                .endDate(career.getEndDate() != null ? career.getEndDate().toString() : null)
                .awardStatus(career.getAwardStatus())
                .certName(career.getCertName())
                .issuingOrg(career.getIssuingOrg())
                .acquiredDate(career.getAcquiredDate() != null ? career.getAcquiredDate().toString() : null)
                .build();
    }
}
