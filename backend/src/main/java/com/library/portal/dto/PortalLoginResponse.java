package com.library.portal.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortalLoginResponse {
    private String token;
    private Long userId;
    private String fullName;
    private String email;
    private String department;
    private String role; // always "USER" for portal accounts
}
