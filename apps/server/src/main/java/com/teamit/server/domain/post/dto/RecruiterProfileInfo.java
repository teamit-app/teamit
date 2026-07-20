package com.teamit.server.domain.post.dto;

import com.teamit.server.domain.contest.entity.ContestParticipant;
import com.teamit.server.domain.user.dto.ExperiencePurposeLabels;
import com.teamit.server.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class RecruiterProfileInfo {

    private String name;
    private List<String> skills;
    private String experienceCount;
    private String intensity;
    private String meetingType;
    private String location;
    private String teamVibe;
    private String feedbackStyle;
    private String leadershipStyle;

    // participate.tsx의 INTENSITY_LABELS/TEAM_VIBE_LABELS/FEEDBACK_LABELS와 동일한 문구로 통일
    // (참여 경험 및 목적 라벨은 ExperiencePurposeLabels로 통일해서 사용)
    private static final String[] INTENSITY_LABELS = {
            null, "주 1~3시간", "주 4~7시간", "주 8~14시간", "주 15시간 이상",
    };
    private static final String[] TEAM_VIBE_LABELS = {
            null, "팀 분위기 최우선", "팀 분위기 우선", "균형 중시", "결과 우선", "결과 최우선",
    };
    private static final String[] FEEDBACK_LABELS = {
            null, "매우 부드럽게", "부드럽게", "상황에 따라요", "솔직하게", "매우 솔직하게",
    };

    // 모집글의 "모집자 정보"는 라이브 매칭 프로필이 아니라, 그 모집글이 속한 공모전에
    // 모집자 본인이 등록한 ContestParticipant 스냅샷을 기준으로 보여준다. 후보 매칭 스코어링도
    // 동일한 스냅샷을 기준으로 하므로(getCandidates), 라이브 프로필이 그 뒤 바뀌어도
    // 이 모집글에서 보여주는 모집자 정보·매칭 기준은 등록 시점 그대로 고정된다.
    public static RecruiterProfileInfo fromSnapshot(User owner, ContestParticipant cp) {
        List<String> skillNames = (cp != null && cp.getSkillsCsv() != null && !cp.getSkillsCsv().isBlank())
                ? Arrays.stream(cp.getSkillsCsv().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList())
                : List.of();

        String experienceCount = "";
        String intensity = "";
        String meetingType = "";
        String teamVibe = "";
        String feedbackStyle = "";
        String leadershipStyle = "";

        if (cp != null) {
            experienceCount = ExperiencePurposeLabels.combined(cp.getExperienceLevel(), cp.getParticipationPurpose());
            Integer intensityLevel = cp.getIntensityLevel();
            if (intensityLevel != null && intensityLevel > 0 && intensityLevel < INTENSITY_LABELS.length) {
                intensity = INTENSITY_LABELS[intensityLevel];
            }
            if (cp.getOnlineOfflinePref() != null) {
                meetingType = switch (cp.getOnlineOfflinePref()) {
                    case "ONLINE" -> "온라인 위주";
                    case "MIXED" -> "온오프라인 모두 가능";
                    case "OFFLINE" -> "오프라인 위주";
                    default -> cp.getOnlineOfflinePref();
                };
            }
            Integer teamVibeLevel = cp.getTeamVibe();
            if (teamVibeLevel != null && teamVibeLevel > 0 && teamVibeLevel < TEAM_VIBE_LABELS.length) {
                teamVibe = TEAM_VIBE_LABELS[teamVibeLevel];
            }
            Integer feedbackLevel = cp.getFeedbackStyle();
            if (feedbackLevel != null && feedbackLevel > 0 && feedbackLevel < FEEDBACK_LABELS.length) {
                feedbackStyle = FEEDBACK_LABELS[feedbackLevel];
            }
            if (cp.getLeadershipPref() != null) {
                leadershipStyle = switch (cp.getLeadershipPref()) {
                    case "WANT" -> "리더 하고 싶어요";
                    case "IF_NEEDED" -> "필요하면 할 수 있어요";
                    case "DONT_WANT" -> "리더는 안 하고 싶어요";
                    default -> cp.getLeadershipPref();
                };
            }
        }

        return RecruiterProfileInfo.builder()
                .name(owner.getNickname())
                .skills(skillNames)
                .experienceCount(experienceCount)
                .intensity(intensity)
                .meetingType(meetingType)
                .location(buildRegionLabel(cp != null ? cp.getRegionsSnapshot() : null))
                .teamVibe(teamVibe)
                .feedbackStyle(feedbackStyle)
                .leadershipStyle(leadershipStyle)
                .build();
    }

    // ContestParticipant.regionsSnapshot 포맷("시도|시군구;시도|시군구")을 사람이 읽는 라벨로 변환
    public static String buildRegionLabel(String regionsSnapshot) {
        if (regionsSnapshot == null || regionsSnapshot.isBlank()) return "";
        return Arrays.stream(regionsSnapshot.split(";"))
                .map(entry -> {
                    String[] parts = entry.split("\\|", -1);
                    String sido = parts[0];
                    String sigungu = parts.length > 1 && !parts[1].isEmpty() ? parts[1] : null;
                    return sigungu != null ? sido + " " + sigungu : sido;
                })
                .collect(Collectors.joining(", "));
    }
}
