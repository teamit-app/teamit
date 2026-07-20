package com.teamit.server.domain.user.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "careers")
public class Career {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "career_type", nullable = false, length = 20)
    private CareerType careerType;

    // 공모전 경력 필드
    @Column(name = "contest_name", length = 100)
    private String contestName;

    @Column(name = "roles_csv", length = 200)
    private String rolesCsv;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "award_status", length = 20)
    private AwardStatus awardStatus;

    // 자격증 필드
    @Column(name = "cert_name", length = 80)
    private String certName;

    @Column(name = "issuing_org", length = 80)
    private String issuingOrg;

    @Column(name = "acquired_date")
    private LocalDate acquiredDate;

    @Builder
    public Career(User user, CareerType careerType, String contestName, String rolesCsv,
                  LocalDate startDate, LocalDate endDate, AwardStatus awardStatus,
                  String certName, String issuingOrg, LocalDate acquiredDate) {
        this.user = user;
        this.careerType = careerType;
        this.contestName = contestName;
        this.rolesCsv = rolesCsv;
        this.startDate = startDate;
        this.endDate = endDate;
        this.awardStatus = awardStatus;
        this.certName = certName;
        this.issuingOrg = issuingOrg;
        this.acquiredDate = acquiredDate;
    }

    public void updateContestInfo(String contestName, String rolesCsv, LocalDate startDate,
                                   LocalDate endDate, AwardStatus awardStatus) {
        this.contestName = contestName;
        this.rolesCsv = rolesCsv;
        this.startDate = startDate;
        this.endDate = endDate;
        this.awardStatus = awardStatus;
    }

    public void updateCertificateInfo(String certName, String issuingOrg, LocalDate acquiredDate) {
        this.certName = certName;
        this.issuingOrg = issuingOrg;
        this.acquiredDate = acquiredDate;
    }
}
