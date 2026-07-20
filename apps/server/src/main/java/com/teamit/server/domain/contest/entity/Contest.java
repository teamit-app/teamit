package com.teamit.server.domain.contest.entity;

import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "contests")
public class Contest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "organizer", nullable = false)
    private String organizer;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private ContestCategory category;

    @Column(name = "target")
    private String target;

    @Column(name = "recruit_field")
    private String recruitField;

    @Column(name = "prize")
    private String prize;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "link_url")
    private String linkUrl;

    // 공모전 상세내용 본문(줄바꿈 포함 자유 텍스트) — 상세 화면 "상세내용" 섹션에 그대로 렌더링
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    // 공모전 포스터 이미지 — 실제 업로드 파이프라인 대신 linkUrl과 동일하게 외부 이미지 URL을 저장
    @Column(name = "image_url")
    private String imageUrl;

    @Builder
    public Contest(String title, String organizer, ContestCategory category,
                   String target, String recruitField, String prize,
                   LocalDate startDate, LocalDate endDate, String linkUrl,
                   String content, String imageUrl) {
        this.title = title;
        this.organizer = organizer;
        this.category = category;
        this.target = target;
        this.recruitField = recruitField;
        this.prize = prize;
        this.startDate = startDate;
        this.endDate = endDate;
        this.linkUrl = linkUrl;
        this.content = content;
        this.imageUrl = imageUrl;
    }

    public void update(String title, String organizer, ContestCategory category,
                        String target, String recruitField, String prize,
                        LocalDate startDate, LocalDate endDate, String linkUrl,
                        String content, String imageUrl) {
        this.title = title;
        this.organizer = organizer;
        this.category = category;
        this.target = target;
        this.recruitField = recruitField;
        this.prize = prize;
        this.startDate = startDate;
        this.endDate = endDate;
        this.linkUrl = linkUrl;
        this.content = content;
        this.imageUrl = imageUrl;
    }
}
