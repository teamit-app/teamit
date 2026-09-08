package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.contest.entity.ContestParticipant;
import com.teamit.server.domain.user.entity.Gender;
import com.teamit.server.domain.user.entity.MatchingProfile;
import com.teamit.server.domain.user.entity.User;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class UserDetailResponseTest {

    private User user() {
        return User.builder().nickname("얼유냄").gender(Gender.MALE).build();
    }

    @Test
    void 참여정보는_라이브_매칭프로필이_비어있어도_공모전_참여카드_스냅샷을_우선_사용한다() {
        // given: 마이페이지 매칭 프로필은 채운 적이 없고(profile=null), 이 공모전에 등록한
        // 참여카드 스냅샷(ContestParticipant)만 있는 상황 — "지원자 및 후보자 > 지원한 사람" 탭에서
        // 카드를 눌러 상세정보로 들어갔을 때 참여 정보가 텅 비어 보이던 버그의 재현 시나리오
        ContestParticipant snapshot = ContestParticipant.builder()
                .skillsCsv("Next.js,TypeScript,Node.js")
                .experienceLevel(1)
                .intensityLevel(3)
                .onlineOfflinePref("MIXED")
                .regionsSnapshot("부산광역시|")
                .teamVibe(2)
                .feedbackStyle(4)
                .leadershipPref("IF_NEEDED")
                .participationPurpose("AWARD")
                .appealTitle("어필 제목")
                .appealContent("어필 내용")
                .build();

        // when
        UserDetailResponse response = UserDetailResponse.from(
                user(), null, List.of(), List.of(), null, snapshot,
                List.of(), List.of(), List.of(), false);

        // then
        assertThat(response.getSkillsDisplay()).containsExactly("Next.js", "TypeScript", "Node.js");
        assertThat(response.getContestExperienceDetail()).isEqualTo("1~3회 · 수상 목적");
        assertThat(response.getIntensityDetail()).isEqualTo("주 8~14h");
        assertThat(response.getMeetingPreference()).isEqualTo("온오프라인 모두 가능 · 부산광역시");
        assertThat(response.getTeamVibeDetail()).isEqualTo("팀 분위기 우선");
        assertThat(response.getFeedbackStyleDetail()).isEqualTo("솔직하게");
        assertThat(response.getLeadershipDetail()).isEqualTo("리더 가능");
        assertThat(response.getAppealTitle()).isEqualTo("어필 제목");
        assertThat(response.getAppealContent()).isEqualTo("어필 내용");
    }

    @Test
    void 스냅샷도_라이브_프로필도_없으면_참여정보는_빈값이다() {
        // when
        UserDetailResponse response = UserDetailResponse.from(
                user(), null, List.of(), List.of(), null, null,
                List.of(), List.of(), List.of(), false);

        // then
        assertThat(response.getSkillsDisplay()).isEmpty();
        assertThat(response.getContestExperienceDetail()).isEmpty();
        assertThat(response.getIntensityDetail()).isEmpty();
        assertThat(response.getMeetingPreference()).isEmpty();
        assertThat(response.getTeamVibeDetail()).isEmpty();
        assertThat(response.getFeedbackStyleDetail()).isEmpty();
        assertThat(response.getLeadershipDetail()).isEmpty();
    }

    @Test
    void 스냅샷이_없으면_기존처럼_라이브_매칭프로필을_그대로_사용한다() {
        // given: contestId 없이 호출되는 기존 경로(예: 인재풀 프로필 상세) — 회귀 확인용
        MatchingProfile profile = MatchingProfile.builder()
                .skillsCsv("Java,Spring")
                .experienceLevel(2)
                .intensityLevel(2)
                .onlineOfflinePref("ONLINE")
                .teamVibe(1)
                .feedbackStyle(1)
                .leadershipPref("WANT")
                .participationPurpose("EXPERIENCE")
                .appealTitle("라이브 제목")
                .appealContent("라이브 내용")
                .build();

        // when
        UserDetailResponse response = UserDetailResponse.from(
                user(), null, List.of(), List.of(), profile, null,
                List.of(), List.of(), List.of(), false);

        // then
        assertThat(response.getSkillsDisplay()).containsExactly("Java", "Spring");
        assertThat(response.getContestExperienceDetail()).isEqualTo("4회 이상 · 경험 목적");
        assertThat(response.getIntensityDetail()).isEqualTo("주 4~7h");
        assertThat(response.getMeetingPreference()).isEqualTo("온라인");
        assertThat(response.getTeamVibeDetail()).isEqualTo("팀 분위기 최우선");
        assertThat(response.getFeedbackStyleDetail()).isEqualTo("매우 부드럽게");
        assertThat(response.getLeadershipDetail()).isEqualTo("리더 선호");
        assertThat(response.getAppealTitle()).isEqualTo("라이브 제목");
        assertThat(response.getAppealContent()).isEqualTo("라이브 내용");
    }
}
