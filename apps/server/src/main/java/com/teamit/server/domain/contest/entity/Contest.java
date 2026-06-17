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

    @Builder
    public Contest(String title, String organizer, ContestCategory category,
                   String target, String recruitField, String prize,
                   LocalDate startDate, LocalDate endDate, String linkUrl) {
        this.title = title;
        this.organizer = organizer;
        this.category = category;
        this.target = target;
        this.recruitField = recruitField;
        this.prize = prize;
        this.startDate = startDate;
        this.endDate = endDate;
        this.linkUrl = linkUrl;
    }
}
