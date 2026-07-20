package com.teamit.server.domain.education.controller;

import com.teamit.server.domain.education.dto.EducationRequest;
import com.teamit.server.domain.education.dto.EducationResponse;
import com.teamit.server.domain.education.dto.EducationVerificationResponse;
import com.teamit.server.domain.education.entity.EducationDocType;
import com.teamit.server.domain.education.service.EducationService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "User", description = "사용자 온보딩 및 프로필 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class EducationController {

    private final EducationService educationService;

    @Operation(summary = "온보딩 학력 저장", description = "학교명, 재학 상태, 전공 정보를 저장합니다.")
    @PostMapping("/educations")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EducationResponse> saveEducation(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody EducationRequest request) {
        EducationResponse response = educationService.saveEducation(userDetails.getUserId(), request);
        return ApiResponse.success(response, "학력 정보가 저장되었습니다");
    }

    @Operation(summary = "학력 인증 서류 제출", description = "학생증/재학증명서 파일을 제출해 심사 대기 상태로 전환합니다.")
    @PostMapping(value = "/educations/{educationId}/verification", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EducationVerificationResponse> submitVerification(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long educationId,
            @RequestParam("docType") EducationDocType docType,
            @RequestParam("file") MultipartFile file) {
        EducationVerificationResponse response =
                educationService.submitVerification(userDetails.getUserId(), educationId, docType, file);
        return ApiResponse.success(response, "서류가 제출되었습니다");
    }

    @Operation(summary = "학력 인증 제출 취소", description = "제출한 인증 서류를 취소하고 미인증 상태로 되돌립니다.")
    @DeleteMapping("/educations/{educationId}/verification")
    public ApiResponse<Void> cancelVerification(
            @LoginUser CustomUserDetails userDetails,
            @PathVariable Long educationId) {
        educationService.cancelVerification(userDetails.getUserId(), educationId);
        return ApiResponse.success(null, "제출이 취소되었습니다");
    }
}
