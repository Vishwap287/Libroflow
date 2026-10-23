package com.library.portal.controller;

import com.library.portal.dto.*;
import com.library.portal.model.PortalUser;
import com.library.portal.service.FineService;
import com.library.portal.service.PortalUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portal/users")
@RequiredArgsConstructor
@CrossOrigin
public class PortalProfileController {

    private final PortalUserService portalUserService;
    private final FineService fineService;

    /** Admin/librarian only: list all registered members (e.g. for a "log a fine" dropdown). */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<List<PortalUserSummary>> listAllUsers() {
        return ResponseEntity.ok(portalUserService.listAllUsers());
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(portalUserService.getProfile(authentication.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<ProfileResponse> updateProfile(Authentication authentication,
                                                          @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(portalUserService.updateProfile(authentication.getName(), request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(Authentication authentication,
                                                                @Valid @RequestBody ChangePasswordRequest request) {
        portalUserService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @GetMapping("/me/dashboard")
    public ResponseEntity<DashboardSummaryResponse> getDashboard(Authentication authentication) {
        PortalUser user = portalUserService.findByEmailOrThrow(authentication.getName());
        return ResponseEntity.ok(fineService.getSummary(user));
    }
}
