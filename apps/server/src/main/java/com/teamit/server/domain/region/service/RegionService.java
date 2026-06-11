package com.teamit.server.domain.region.service;

import com.teamit.server.domain.region.dto.RegionRequest;
import com.teamit.server.domain.region.dto.RegionResponse;
import com.teamit.server.domain.region.entity.UserRegion;
import com.teamit.server.domain.region.repository.UserRegionRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RegionService {

    private final UserRegionRepository userRegionRepository;
    private final UserRepository userRepository;

    @Transactional
    public RegionResponse saveRegions(Long userId, RegionRequest request) {
        User user = userRepository.findById(userId).orElseThrow();

        userRegionRepository.deleteAllByUserId(userId);

        List<UserRegion> regions = request.getRegions().stream()
                .map(item -> UserRegion.builder()
                        .user(user)
                        .sido(item.getSido())
                        .sigungu(item.getSigungu())
                        .build())
                .toList();

        List<UserRegion> saved = userRegionRepository.saveAll(regions);

        List<RegionResponse.RegionItem> responseItems = saved.stream()
                .map(r -> RegionResponse.RegionItem.builder()
                        .id(r.getId())
                        .sido(r.getSido())
                        .sigungu(r.getSigungu())
                        .build())
                .toList();

        return RegionResponse.builder()
                .regions(responseItems)
                .build();
    }
}
