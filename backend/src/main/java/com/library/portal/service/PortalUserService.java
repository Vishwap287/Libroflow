package com.library.portal.service;

import com.library.portal.dto.*;
import com.library.portal.exception.PortalBadRequestException;
import com.library.portal.exception.PortalNotFoundException;
import com.library.portal.model.PortalUser;
import com.library.portal.repository.PortalUserRepository;
import com.library.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PortalUserService {

    private final PortalUserRepository portalUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public PortalLoginResponse register(PortalRegisterRequest request) {
        if (portalUserRepository.existsByEmail(request.getEmail())) {
            throw new PortalBadRequestException("An account with this email already exists. Please sign in instead.");
        }

        PortalUser user = PortalUser.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .department(request.getDepartment())
                .password(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .build();

        portalUserRepository.save(user);

        return buildLoginResponse(user);
    }

    public PortalLoginResponse login(PortalLoginRequest request) {
        PortalUser user = portalUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new PortalBadRequestException("Your account is not active. Please contact the library administrator.");
        }

        return buildLoginResponse(user);
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        PortalUser user = portalUserRepository.findByEmailAndPhone(request.getEmail(), request.getPhone())
                .orElseThrow(() -> new PortalBadRequestException(
                        "We couldn't verify your identity. Please check your email and the phone number on file."));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        portalUserRepository.save(user);
    }

    public ProfileResponse getProfile(String email) {
        PortalUser user = findByEmailOrThrow(email);
        return toProfileResponse(user);
    }

    /** Admin/librarian use: list all registered members (for dropdowns and overview screens). */
    public List<PortalUserSummary> listAllUsers() {
        return portalUserRepository.findAll().stream()
                .map(u -> PortalUserSummary.builder()
                        .userId(u.getUserId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .department(u.getDepartment())
                        .status(u.getStatus())
                        .build())
                .toList();
    }

    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        PortalUser user = findByEmailOrThrow(email);
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setDepartment(request.getDepartment());
        portalUserRepository.save(user);
        return toProfileResponse(user);
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        PortalUser user = findByEmailOrThrow(email);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new PortalBadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        portalUserRepository.save(user);
    }

    public PortalUser findByEmailOrThrow(String email) {
        return portalUserRepository.findByEmail(email)
                .orElseThrow(() -> new PortalNotFoundException("User not found"));
    }

    private PortalLoginResponse buildLoginResponse(PortalUser user) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        String token = jwtUtil.generateToken(userDetails);

        return PortalLoginResponse.builder()
                .token(token)
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .role("USER")
                .build();
    }

    private ProfileResponse toProfileResponse(PortalUser user) {
        return ProfileResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .department(user.getDepartment())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
