package com.teamit.server.domain.education.entity;

import com.teamit.server.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(20)")
    private EducationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "major_type", nullable = false, columnDefinition = "VARCHAR(20)")
    private MajorType majorType;

    @Column(name = "major", nullable = false, length = 100)
    private String major;

    @Column(name = "sub_major", length = 100)
    private String subMajor;

    @Column(name = "verified", nullable = false)
    private boolean verified;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", columnDefinition = "VARCHAR(20)")
    private VerificationStatus verificationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_doc_type", columnDefinition = "VARCHAR(20)")
    private EducationDocType verificationDocType;

    @Column(name = "verification_file_name", length = 255)
    private String verificationFileName;

    @Column(name = "verification_submitted_at")
    private LocalDateTime verificationSubmittedAt;

    @Column(name = "verification_reject_reason", length = 255)
    private String verificationRejectReason;

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
        this.verificationStatus = VerificationStatus.NONE;
    }

    /** 학력 정보 수정 — 학교/전공이 바뀌면(신입학·편입·전과·복수전공 추가 등) 기존 인증은 무효화된다. 반환값: 인증이 무효화됐는지 여부 */
    public boolean updateInfo(String schoolName, EducationStatus status,
                               MajorType majorType, String major, String subMajor) {
        boolean schoolChanged = !this.schoolName.equals(schoolName);
        boolean majorChanged = !this.major.equals(major);
        boolean subMajorChanged = !java.util.Objects.equals(this.subMajor, subMajor);
        boolean verificationReset = (schoolChanged || majorChanged || subMajorChanged)
                && getEffectiveVerificationStatus() != VerificationStatus.NONE;

        this.schoolName = schoolName;
        this.status = status;
        this.majorType = majorType;
        this.major = major;
        this.subMajor = subMajor;

        if (verificationReset) {
            this.verified = false;
            this.verificationStatus = VerificationStatus.NONE;
            this.verificationDocType = null;
            this.verificationFileName = null;
            this.verificationSubmittedAt = null;
            this.verificationRejectReason = null;
        }
        return verificationReset;
    }

    /** 인증 서류 제출 — 심사 대기 상태로 전환 */
    public void submitVerification(EducationDocType docType, String fileName) {
        this.verificationStatus = VerificationStatus.PENDING;
        this.verificationDocType = docType;
        this.verificationFileName = fileName;
        this.verificationSubmittedAt = LocalDateTime.now();
        this.verificationRejectReason = null;
    }

    /** 관리자 승인 */
    public void approve() {
        this.verified = true;
        this.verificationStatus = VerificationStatus.APPROVED;
        this.verificationRejectReason = null;
    }

    /** 관리자 거절 */
    public void reject(String reason) {
        this.verified = false;
        this.verificationStatus = VerificationStatus.REJECTED;
        this.verificationRejectReason = reason;
    }

    /** 제출한 인증 서류 취소 — 미인증 상태로 되돌림 */
    public void cancelVerification() {
        this.verified = false;
        this.verificationStatus = VerificationStatus.NONE;
        this.verificationDocType = null;
        this.verificationFileName = null;
        this.verificationSubmittedAt = null;
        this.verificationRejectReason = null;
    }

    /** 이 컬럼이 생기기 전에 만들어진 기존 row는 verificationStatus가 null일 수 있다 */
    public VerificationStatus getEffectiveVerificationStatus() {
        return verificationStatus != null ? verificationStatus : VerificationStatus.NONE;
    }
}
