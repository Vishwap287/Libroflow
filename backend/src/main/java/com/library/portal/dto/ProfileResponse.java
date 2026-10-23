package com.library.portal.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String department;
    private String status;
    private LocalDateTime createdAt;
}
