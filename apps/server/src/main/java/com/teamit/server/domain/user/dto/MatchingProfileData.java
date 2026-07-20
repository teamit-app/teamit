package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.contest.entity.ContestParticipant;
import com.teamit.server.domain.region.entity.UserRegion;
import com.teamit.server.domain.user.entity.MatchingProfile;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingProfileData {

    private List<String> skills;
    private int experienceLevel;
    private int intensityLevel;
    private String onlineOfflinePref;
    private List<RegionInfo> regions;
    private int teamVibe;
    private int feedbackStyle;
    private String leadershipPref;
    private String participationPurpose;
    private String appealTitle;
    private String appealContent;

    public record RegionInfo(String sido, String sigungu) {}

    public static MatchingProfileData from(MatchingProfile profile, List<UserRegion> userRegions) {
        List<String> skills = (profile.getSkillsCsv() != null && !profile.getSkillsCsv().isBlank())
                ? Arrays.asList(profile.getSkillsCsv().split(","))
                : List.of();

        List<RegionInfo> regions = userRegions.stream()
                .map(r -> new RegionInfo(r.getSido(), r.getSigungu()))
                .collect(Collectors.toList());

        return MatchingProfileData.builder()
                .skills(skills)
                .experienceLevel(profile.getExperienceLevel() != null ? profile.getExperienceLevel() : 0)
                .intensityLevel(profile.getIntensityLevel() != null ? profile.getIntensityLevel() : 1)
                .onlineOfflinePref(profile.getOnlineOfflinePref() != null ? profile.getOnlineOfflinePref() : "MIXED")
                .regions(regions)
                .teamVibe(profile.getTeamVibe() != null ? profile.getTeamVibe() : 1)
                .feedbackStyle(profile.getFeedbackStyle() != null ? profile.getFeedbackStyle() : 1)
                .leadershipPref(profile.getLeadershipPref() != null ? profile.getLeadershipPref() : "IF_NEEDED")
                .participationPurpose(profile.getParticipationPurpose() != null ? profile.getParticipationPurpose() : "EXPERIENCE")
                .appealTitle(profile.getAppealTitle() != null ? profile.getAppealTitle() : "")
                .appealContent(profile.getAppealContent() != null ? profile.getAppealContent() : "")
                .build();
    }

    public static MatchingProfileData fromSnapshot(ContestParticipant snapshot) {
        List<String> skills = (snapshot.getSkillsCsv() != null && !snapshot.getSkillsCsv().isBlank())
                ? Arrays.asList(snapshot.getSkillsCsv().split(","))
                : List.of();

        List<RegionInfo> regions = (snapshot.getRegionsSnapshot() != null && !snapshot.getRegionsSnapshot().isBlank())
                ? Arrays.stream(snapshot.getRegionsSnapshot().split(";"))
                        .map(entry -> {
                            String[] parts = entry.split("\\|", -1);
                            String sigungu = parts.length > 1 && !parts[1].isEmpty() ? parts[1] : null;
                            return new RegionInfo(parts[0], sigungu);
                        })
                        .collect(Collectors.toList())
                : List.of();

        return MatchingProfileData.builder()
                .skills(skills)
                .experienceLevel(snapshot.getExperienceLevel() != null ? snapshot.getExperienceLevel() : 0)
                .intensityLevel(snapshot.getIntensityLevel() != null ? snapshot.getIntensityLevel() : 1)
                .onlineOfflinePref(snapshot.getOnlineOfflinePref() != null ? snapshot.getOnlineOfflinePref() : "MIXED")
                .regions(regions)
                .teamVibe(snapshot.getTeamVibe() != null ? snapshot.getTeamVibe() : 1)
                .feedbackStyle(snapshot.getFeedbackStyle() != null ? snapshot.getFeedbackStyle() : 1)
                .leadershipPref(snapshot.getLeadershipPref() != null ? snapshot.getLeadershipPref() : "IF_NEEDED")
                .participationPurpose(snapshot.getParticipationPurpose() != null ? snapshot.getParticipationPurpose() : "EXPERIENCE")
                .appealTitle(snapshot.getAppealTitle() != null ? snapshot.getAppealTitle() : "")
                .appealContent(snapshot.getAppealContent() != null ? snapshot.getAppealContent() : "")
                .build();
    }
}
