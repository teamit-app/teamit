package com.teamit.server.domain.user.dto;

// "공모전 참여 경험 및 목적"을 한 줄로 보여주기 위한 라벨 변환 유틸.
// PostApplicantResponse/UserDetailResponse/RecruiterProfileInfo 등 여러 DTO에서
// 동일한 조합 로직을 중복 구현하지 않도록 이 클래스로 통일한다.
public class ExperiencePurposeLabels {

    private ExperiencePurposeLabels() {}

    public static String experienceLabel(Integer level) {
        if (level == null) return "";
        return switch (level) {
            case 0 -> "0회";
            case 1 -> "1~3회";
            case 2 -> "4회 이상";
            default -> "";
        };
    }

    public static String purposeLabel(String purpose) {
        if (purpose == null) return "";
        return switch (purpose) {
            case "EXPERIENCE" -> "경험 목적";
            case "AWARD" -> "수상 목적";
            default -> "";
        };
    }

    public static String combined(Integer level, String purpose) {
        String exp = experienceLabel(level);
        String pur = purposeLabel(purpose);
        if (exp.isEmpty()) return pur;
        if (pur.isEmpty()) return exp;
        return exp + " · " + pur;
    }
}
