package com.teamit.server.domain.region.controller;

import com.teamit.server.domain.region.dto.RegionRequest;
import com.teamit.server.domain.region.dto.RegionResponse;
import com.teamit.server.domain.region.service.RegionService;
import com.teamit.server.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "사용자 온보딩 및 프로필 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @Operation(summary = "온보딩 지역 저장", description = "사용자의 활동 가능 지역(시도/시군구)을 저장합니다.")
    @PostMapping("/{userId}/regions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RegionResponse> saveRegions(
            @PathVariable Long userId,
            @RequestBody RegionRequest request) {
        RegionResponse response = regionService.saveRegions(userId, request);
        return ApiResponse.success(response, "지역 정보가 저장되었습니다");
    }
}
