package com.teamit.server.domain.contest.entity;

import com.teamit.server.domain.user.entity.User;
import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "contest_participants", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"contest_id", "user_id"})
})
public class ContestParticipant extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", nullable = false)
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 후보 등록 시점의 매칭 프로필 스냅샷 (이후 매칭 프로필이 바뀌어도 이 값은 고정됨)
    @Column(name = "skills_csv", columnDefinition = "TEXT")
    private String skillsCsv;

    @Column(name = "experience_level")
    private Integer experienceLevel;

    @Column(name = "intensity_level")
    private Integer intensityLevel;

    @Column(name = "online_offline_pref", length = 20)
    private String onlineOfflinePref;

    // "시도|시군구" 항목을 ";"로 이어붙인 직렬화 문자열 (시군구 없으면 빈 문자열)
    @Column(name = "regions_snapshot", columnDefinition = "TEXT")
    private String regionsSnapshot;

    @Column(name = "team_vibe")
    private Integer teamVibe;

    @Column(name = "feedback_style")
    private Integer feedbackStyle;

    @Column(name = "leadership_pref", length = 20)
    private String leadershipPref;

    // 참여 목적: "EXPERIENCE"(경험) 또는 "AWARD"(수상) — 등록 시점 스냅샷
    @Column(name = "participation_purpose", length = 20)
    private String participationPurpose;

    @Column(name = "appeal_title", length = 200)
    private String appealTitle;

    @Column(name = "appeal_content", columnDefinition = "TEXT")
    private String appealContent;

    public void updateSnapshot(String skillsCsv, Integer experienceLevel, Integer intensityLevel,
                               String onlineOfflinePref, String regionsSnapshot, Integer teamVibe,
                               Integer feedbackStyle, String leadershipPref, String participationPurpose,
                               String appealTitle, String appealContent) {
        this.skillsCsv = skillsCsv;
        this.experienceLevel = experienceLevel;
        this.intensityLevel = intensityLevel;
        this.onlineOfflinePref = onlineOfflinePref;
        this.regionsSnapshot = regionsSnapshot;
        this.teamVibe = teamVibe;
        this.feedbackStyle = feedbackStyle;
        this.leadershipPref = leadershipPref;
        this.participationPurpose = participationPurpose;
        this.appealTitle = appealTitle;
        this.appealContent = appealContent;
    }

    @Builder
    public ContestParticipant(Contest contest, User user, String skillsCsv, Integer experienceLevel,
                               Integer intensityLevel, String onlineOfflinePref, String regionsSnapshot,
                               Integer teamVibe, Integer feedbackStyle, String leadershipPref,
                               String participationPurpose, String appealTitle, String appealContent) {
        this.contest = contest;
        this.user = user;
        this.skillsCsv = skillsCsv;
        this.experienceLevel = experienceLevel;
        this.intensityLevel = intensityLevel;
        this.onlineOfflinePref = onlineOfflinePref;
        this.regionsSnapshot = regionsSnapshot;
        this.teamVibe = teamVibe;
        this.feedbackStyle = feedbackStyle;
        this.leadershipPref = leadershipPref;
        this.participationPurpose = participationPurpose;
        this.appealTitle = appealTitle;
        this.appealContent = appealContent;
    }
}
