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

    // 기본 varchar(255)로는 마케팅 사이트의 트래킹 파라미터 붙은 접수 URL이 잘려서
    // 저장 실패(Data too long)가 나는 경우가 있어 TEXT로 넉넉하게 잡는다
    @Column(name = "link_url", columnDefinition = "TEXT")
    private String linkUrl;

    // 공모전 상세내용 본문(줄바꿈 포함 자유 텍스트) — 상세 화면 "상세내용" 섹션에 그대로 렌더링
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    // 관리자가 갤러리에서 업로드하면 짧은 내부 경로(/files/...)지만, 외부 URL을 직접 입력하는
    // 경로도 계속 지원하므로 linkUrl과 같은 이유로 TEXT로 잡는다
    @Column(name = "image_url", columnDefinition = "TEXT")
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
