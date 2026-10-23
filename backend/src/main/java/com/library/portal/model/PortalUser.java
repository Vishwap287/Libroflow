package com.library.portal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents a self-service portal account (library patron), completely
 * separate from the existing admin/librarian `users` table used by the
 * admin module's login. Table: portal_users.
 */
@Entity
@Table(name = "portal_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortalUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @NotBlank(message = "Full name is required")
    @Column(nullable = false)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email")
    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    private String department;

    @NotBlank(message = "Password is required")
    @Column(nullable = false)
    private String password;

    @Builder.Default
    @Column(nullable = false)
    private String status = "ACTIVE";

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
