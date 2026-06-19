package com.teamit.server.domain.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class HeartedUserListResponse {

    private List<HeartedUserResponse> content;
}
