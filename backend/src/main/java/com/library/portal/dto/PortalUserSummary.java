package com.library.portal.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortalUserSummary {
    private Long userId;
    private String fullName;
    private String email;
    private String department;
    private String status;
}
