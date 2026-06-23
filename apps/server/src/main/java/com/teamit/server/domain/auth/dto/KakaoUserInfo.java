package com.teamit.server.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class KakaoUserInfo {

    private Long id;

    @JsonProperty("kakao_account")
    private KakaoAccount kakaoAccount;

    public String getNickname() {
        if (kakaoAccount != null && kakaoAccount.getProfile() != null) {
            String nickname = kakaoAccount.getProfile().getNickname();
            // nickname 최대 20자 제한
            return nickname != null && nickname.length() > 20
                    ? nickname.substring(0, 20)
                    : nickname;
        }
        return "팀잇유저";
    }

    public String getProfileImageUrl() {
        if (kakaoAccount != null && kakaoAccount.getProfile() != null) {
            return kakaoAccount.getProfile().getProfileImageUrl();
        }
        return null;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class KakaoAccount {
        private Profile profile;

        @Getter
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Profile {
            private String nickname;

            @JsonProperty("profile_image_url")
            private String profileImageUrl;
        }
    }
}
