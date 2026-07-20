package com.teamit.server.domain.region.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegionResponse {

    private List<RegionItem> regions;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegionItem {
        private Long id;
        private String sido;
        private String sigungu;
    }
}
