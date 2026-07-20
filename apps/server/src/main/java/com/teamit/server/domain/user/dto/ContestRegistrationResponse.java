package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.contest.entity.ContestParticipant;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Getter
@Builder
public class ContestRegistrationResponse {

    private Long registrationId;
    private Long contestId;
    private String contestTitle;
    private String organizer;
    private String registeredAt;
    private String endDate;
    private long dDay;
    private ParticipantCardInfo participantCard;

    @Getter
    @Builder
    public static class ParticipantCardInfo {
        private List<String> skills;
        private Integer experienceLevel;
        private Integer intensityLevel;
        private String onlineOfflinePref;
        private String region;
        private Integer teamVibe;
        private Integer feedbackStyle;
        private String leadershipPref;
        private String appealTitle;
        private String appealContent;
    }

    public static ContestRegistrationResponse from(ContestParticipant cp) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy.MM.dd");
        LocalDate end = cp.getContest().getEndDate();
        long dDay = ChronoUnit.DAYS.between(LocalDate.now(), end);

        List<String> skills = (cp.getSkillsCsv() != null && !cp.getSkillsCsv().isBlank())
                ? Arrays.asList(cp.getSkillsCsv().split(","))
                : Collections.emptyList();

        String region = "";
        if (cp.getRegionsSnapshot() != null && !cp.getRegionsSnapshot().isBlank()) {
            String[] parts = cp.getRegionsSnapshot().split(";");
            if (parts.length > 0) {
                String[] sidoSigungu = parts[0].split("\\|");
                region = sidoSigungu.length >= 2 && !sidoSigungu[1].isBlank()
                        ? sidoSigungu[0] + " " + sidoSigungu[1]
                        : sidoSigungu[0];
            }
        }

        ParticipantCardInfo card = ParticipantCardInfo.builder()
                .skills(skills)
                .experienceLevel(cp.getExperienceLevel())
                .intensityLevel(cp.getIntensityLevel())
                .onlineOfflinePref(cp.getOnlineOfflinePref())
                .region(region)
                .teamVibe(cp.getTeamVibe())
                .feedbackStyle(cp.getFeedbackStyle())
                .leadershipPref(cp.getLeadershipPref())
                .appealTitle(cp.getAppealTitle() != null ? cp.getAppealTitle() : "")
                .appealContent(cp.getAppealContent() != null ? cp.getAppealContent() : "")
                .build();

        return ContestRegistrationResponse.builder()
                .registrationId(cp.getId())
                .contestId(cp.getContest().getId())
                .contestTitle(cp.getContest().getTitle())
                .organizer(cp.getContest().getOrganizer())
                .registeredAt(cp.getCreatedAt().format(fmt))
                .endDate(end.format(fmt))
                .dDay(dDay)
                .participantCard(card)
                .build();
    }
}
