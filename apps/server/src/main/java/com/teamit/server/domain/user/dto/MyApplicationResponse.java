package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.matching.entity.PostApplication;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class MyApplicationResponse {

    private Long applicationId;
    private Long postId;
    private Long contestId;
    private String contestTitle;
    private String postTitle;
    private String authorNickname;
    private String appliedAt;
    private String status;

    public static MyApplicationResponse from(PostApplication app, Contest contest) {
        return MyApplicationResponse.builder()
                .applicationId(app.getId())
                .postId(app.getPost().getId())
                .contestId(app.getPost().getContestId())
                .contestTitle(contest != null ? contest.getTitle() : null)
                .postTitle(app.getPost().getTitle())
                .authorNickname(app.getPost().getOwner().getNickname())
                .appliedAt(app.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy.MM.dd")))
                .status(app.getStatus().name())
                .build();
    }
}
