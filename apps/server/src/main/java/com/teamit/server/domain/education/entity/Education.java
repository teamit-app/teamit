package com.teamit.server.domain.education.entity;

import com.teamit.server.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "education")
public class Education {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "school_name", nullable = false, length = 100)
    private String schoolName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EducationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "major_type", nullable = false)
    private MajorType majorType;

    @Column(name = "major", nullable = false, length = 100)
    private String major;

    @Column(name = "sub_major", length = 100)
    private String subMajor;

    @Column(name = "verified", nullable = false)
    private boolean verified;

    @Builder
    public Education(User user, String schoolName, EducationStatus status,
                     MajorType majorType, String major, String subMajor) {
        this.user = user;
        this.schoolName = schoolName;
        this.status = status;
        this.majorType = majorType;
        this.major = major;
        this.subMajor = subMajor;
        this.verified = false;
    }
}
