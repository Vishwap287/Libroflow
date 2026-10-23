package com.library.portal.controller;

import com.library.portal.dto.ForgotPasswordRequest;
import com.library.portal.dto.PortalLoginRequest;
import com.library.portal.dto.PortalLoginResponse;
import com.library.portal.dto.PortalRegisterRequest;
import com.library.portal.service.PortalUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/portal/auth")
@RequiredArgsConstructor
@CrossOrigin
public class PortalAuthController {

    private final PortalUserService portalUserService;

    @PostMapping("/register")
    public ResponseEntity<PortalLoginResponse> register(@Valid @RequestBody PortalRegisterRequest request) {
        return ResponseEntity.ok(portalUserService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<PortalLoginResponse> login(@Valid @RequestBody PortalLoginRequest request) {
        return ResponseEntity.ok(portalUserService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        portalUserService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "Your password has been reset successfully. You can now sign in."));
    }
}
