package com.teamit.server.domain.region.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class RegionRequest {

    private List<RegionItem> regions;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class RegionItem {
        private String sido;
        private String sigungu;
    }
}
