package com.teamit.server.domain.region.service;

import com.teamit.server.domain.region.dto.RegionRequest;
import com.teamit.server.domain.region.dto.RegionResponse;
import com.teamit.server.domain.region.entity.UserRegion;
import com.teamit.server.domain.region.repository.UserRegionRepository;
import com.teamit.server.domain.user.entity.Gender;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;

@ExtendWith(MockitoExtension.class)
class RegionServiceTest {

    @Mock
    private UserRegionRepository userRegionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RegionService regionService;

    @Test
    void 지역_저장_성공_복수_지역() {
        // given
        Long userId = 1L;

        User user = User.builder()
                .nickname("김티밋")
                .name("김민준")
                .gender(Gender.MALE)
                .birthDate(LocalDate.of(2002, 5, 11))
                .isMatchingActive(false)
                .build();

        RegionRequest.RegionItem item1 = new RegionRequest.RegionItem();
        item1.setSido("서울");
        item1.setSigungu("강남구");

        RegionRequest.RegionItem item2 = new RegionRequest.RegionItem();
        item2.setSido("경기");
        item2.setSigungu(null);

        RegionRequest request = new RegionRequest();
        request.setRegions(List.of(item1, item2));

        List<UserRegion> savedRegions = List.of(
                UserRegion.builder().user(user).sido("서울").sigungu("강남구").build(),
                UserRegion.builder().user(user).sido("경기").sigungu(null).build()
        );

        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        willDoNothing().given(userRegionRepository).deleteAllByUserId(userId);
        given(userRegionRepository.saveAll(anyList())).willReturn(savedRegions);

        // when
        RegionResponse response = regionService.saveRegions(userId, request);

        // then
        assertThat(response.getRegions()).hasSize(2);
        assertThat(response.getRegions().get(0).getSido()).isEqualTo("서울");
        assertThat(response.getRegions().get(0).getSigungu()).isEqualTo("강남구");
        assertThat(response.getRegions().get(1).getSido()).isEqualTo("경기");
        assertThat(response.getRegions().get(1).getSigungu()).isNull();
    }

    @Test
    void 지역_저장_빈_리스트_처리() {
        // given
        Long userId = 1L;

        User user = User.builder()
                .nickname("김티밋")
                .name("김민준")
                .gender(Gender.MALE)
                .birthDate(LocalDate.of(2002, 5, 11))
                .isMatchingActive(false)
                .build();

        RegionRequest request = new RegionRequest();
        request.setRegions(List.of());

        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        willDoNothing().given(userRegionRepository).deleteAllByUserId(userId);
        given(userRegionRepository.saveAll(anyList())).willReturn(List.of());

        // when
        RegionResponse response = regionService.saveRegions(userId, request);

        // then
        assertThat(response.getRegions()).isEmpty();
    }
}
