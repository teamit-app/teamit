package com.teamit.server.domain.region.controller;

import com.teamit.server.domain.region.dto.RegionRequest;
import com.teamit.server.domain.region.dto.RegionResponse;
import com.teamit.server.domain.region.service.RegionService;
import com.teamit.server.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @PostMapping("/{userId}/regions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RegionResponse> saveRegions(
            @PathVariable Long userId,
            @RequestBody RegionRequest request) {
        RegionResponse response = regionService.saveRegions(userId, request);
        return ApiResponse.success(response, "지역 정보가 저장되었습니다");
    }
}
