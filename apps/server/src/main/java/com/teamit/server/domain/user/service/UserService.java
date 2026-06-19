package com.teamit.server.domain.user.service;

import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.education.repository.EducationRepository;
import com.teamit.server.domain.user.dto.*;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.entity.UserHeart;
import com.teamit.server.domain.user.entity.UserSkill;
import com.teamit.server.domain.user.repository.UserHeartRepository;
import com.teamit.server.domain.user.repository.UserRepository;
import com.teamit.server.domain.user.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EducationRepository educationRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserHeartRepository userHeartRepository;

    @Transactional
    public OnboardingBasicResponse saveBasicInfo(OnboardingBasicRequest request) {
        User user = User.builder()
                .nickname(request.getNickname())
                .name(request.getName())
                .gender(request.getGender())
                .birthDate(request.getBirthDate())
                .isMatchingActive(false)
                .build();

        User saved = userRepository.save(user);

        return OnboardingBasicResponse.builder()
                .userId(saved.getId())
                .nickname(saved.getNickname())
                .name(saved.getName())
                .gender(saved.getGender())
                .birthDate(saved.getBirthDate())
                .build();
    }

    @Transactional(readOnly = true)
    public UserPoolPageResponse getUserPool(Long skillId, String sido, String role, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = userRepository.findUserPool(skillId, sido, keyword, pageable);

        List<Long> userIds = userPage.getContent().stream()
                .map(User::getId)
                .collect(Collectors.toList());

        Map<Long, Education> educationMap = educationRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(e -> e.getUser().getId(), e -> e));

        Map<Long, List<UserSkill>> skillMap = userSkillRepository.findAllByUserIdInWithSkill(userIds).stream()
                .collect(Collectors.groupingBy(us -> us.getUser().getId()));

        List<UserPoolResponse> content = userPage.getContent().stream()
                .map(user -> {
                    Education education = educationMap.get(user.getId());
                    List<UserSkillInfo> skills = skillMap.getOrDefault(user.getId(), List.of()).stream()
                            .map(UserSkillInfo::from)
                            .collect(Collectors.toList());
                    return UserPoolResponse.of(user, education, skills);
                })
                .collect(Collectors.toList());

        return UserPoolPageResponse.builder()
                .content(content)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .currentPage(userPage.getNumber())
                .build();
    }

    @Transactional
    public void addHeart(Long userId, Long targetUserId) {
        if (userHeartRepository.existsByUserIdAndTargetUserId(userId, targetUserId)) {
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("대상 사용자를 찾을 수 없습니다"));

        userHeartRepository.save(UserHeart.builder()
                .user(user)
                .targetUser(targetUser)
                .build());
    }

    @Transactional
    public void removeHeart(Long userId, Long targetUserId) {
        userHeartRepository.findByUserIdAndTargetUserId(userId, targetUserId)
                .ifPresent(userHeartRepository::delete);
    }

    @Transactional(readOnly = true)
    public HeartedUserListResponse getHeartedUsers(Long userId) {
        List<UserHeart> hearts = userHeartRepository.findAllByUserId(userId);

        List<Long> targetIds = hearts.stream()
                .map(h -> h.getTargetUser().getId())
                .collect(Collectors.toList());

        Map<Long, Education> educationMap = educationRepository.findByUserIdIn(targetIds).stream()
                .collect(Collectors.toMap(e -> e.getUser().getId(), e -> e));

        Map<Long, List<UserSkill>> skillMap = userSkillRepository.findAllByUserIdInWithSkill(targetIds).stream()
                .collect(Collectors.groupingBy(us -> us.getUser().getId()));

        List<HeartedUserResponse> content = hearts.stream()
                .map(heart -> {
                    User target = heart.getTargetUser();
                    Education education = educationMap.get(target.getId());
                    List<UserSkillInfo> skills = skillMap.getOrDefault(target.getId(), List.of()).stream()
                            .map(UserSkillInfo::from)
                            .collect(Collectors.toList());
                    return HeartedUserResponse.of(target, education, skills);
                })
                .collect(Collectors.toList());

        return HeartedUserListResponse.builder()
                .content(content)
                .build();
    }
}
