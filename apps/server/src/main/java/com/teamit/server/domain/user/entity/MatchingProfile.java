package com.teamit.server.domain.user.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "matching_profile")
public class MatchingProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "skills_csv", columnDefinition = "TEXT")
    private String skillsCsv;

    @Column(name = "experience_level")
    private Integer experienceLevel;

    @Column(name = "intensity_level")
    private Integer intensityLevel;

    @Column(name = "online_offline_pref", length = 20)
    private String onlineOfflinePref;

    @Column(name = "team_vibe")
    private Integer teamVibe;

    @Column(name = "feedback_style")
    private Integer feedbackStyle;

    @Column(name = "leadership_pref", length = 20)
    private String leadershipPref;

    // 참여 목적: "EXPERIENCE"(경험) 또는 "AWARD"(수상)
    @Column(name = "participation_purpose", length = 20)
    private String participationPurpose;

    @Column(name = "appeal_title", length = 200)
    private String appealTitle;

    @Column(name = "appeal_content", columnDefinition = "TEXT")
    private String appealContent;

    @Builder
    public MatchingProfile(User user, String skillsCsv, Integer experienceLevel,
                           Integer intensityLevel, String onlineOfflinePref,
                           Integer teamVibe, Integer feedbackStyle,
                           String leadershipPref, String participationPurpose,
                           String appealTitle, String appealContent) {
        this.user = user;
        this.skillsCsv = skillsCsv;
        this.experienceLevel = experienceLevel;
        this.intensityLevel = intensityLevel;
        this.onlineOfflinePref = onlineOfflinePref;
        this.teamVibe = teamVibe;
        this.feedbackStyle = feedbackStyle;
        this.leadershipPref = leadershipPref;
        this.participationPurpose = participationPurpose;
        this.appealTitle = appealTitle;
        this.appealContent = appealContent;
    }

    public void updateProfile(String skillsCsv, Integer experienceLevel,
                              Integer intensityLevel, String onlineOfflinePref,
                              Integer teamVibe, Integer feedbackStyle,
                              String leadershipPref, String participationPurpose,
                              String appealTitle, String appealContent) {
        this.skillsCsv = skillsCsv;
        this.experienceLevel = experienceLevel;
        this.intensityLevel = intensityLevel;
        this.onlineOfflinePref = onlineOfflinePref;
        this.teamVibe = teamVibe;
        this.feedbackStyle = feedbackStyle;
        this.leadershipPref = leadershipPref;
        this.participationPurpose = participationPurpose;
        this.appealTitle = appealTitle;
        this.appealContent = appealContent;
    }
}
