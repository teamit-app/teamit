package com.teamit.server.domain.education.controller;

import com.teamit.server.domain.education.dto.PendingEducationResponse;
import com.teamit.server.domain.education.dto.ReviewEducationRequest;
import com.teamit.server.domain.education.service.EducationService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.AdminAuthorizer;
import com.teamit.server.global.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLConnection;
import java.util.List;

@Tag(name = "Admin", description = "관리자 전용 API (users.role = ADMIN인 유저만 허용)")
@RestController
@RequestMapping("/api/v1/admin/educations")
@RequiredArgsConstructor
public class AdminEducationController {

    private final EducationService educationService;
    private final AdminAuthorizer adminAuthorizer;

    @Operation(summary = "심사 대기 중인 학력 인증 목록 조회")
    @GetMapping("/pending")
    public ApiResponse<List<PendingEducationResponse>> getPendingVerifications(
            @LoginUser CustomUserDetails userDetails) {
        adminAuthorizer.check(userDetails.getUserId());
        return ApiResponse.success(educationService.getPendingVerifications(), "심사 대기 목록 조회 성공");
    }

    @Operation(summary = "제출된 인증 서류 파일 조회", description = "브라우저/앱에서 바로 열어볼 수 있도록 이미지를 스트리밍한다.")
    @GetMapping("/{educationId}/file")
    public ResponseEntity<Resource> getVerificationFile(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long educationId) throws IOException {
        adminAuthorizer.check(userDetails.getUserId());
        Resource resource = educationService.loadVerificationFile(educationId);

        String contentType = URLConnection.guessContentTypeFromName(resource.getFilename());
        MediaType mediaType = contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @Operation(summary = "학력 인증 심사(승인/거절)")
    @PatchMapping("/{educationId}/verification")
    public ApiResponse<Void> reviewVerification(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long educationId,
            @RequestBody ReviewEducationRequest request) {
        adminAuthorizer.check(userDetails.getUserId());
        educationService.reviewVerification(educationId, request.getStatus(), request.getRejectReason());
        return ApiResponse.success(null, "심사 결과가 반영되었습니다");
    }
}
