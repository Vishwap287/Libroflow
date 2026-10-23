package com.library.portal.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {
    private String fullName;
    private String email;
    private String department;
    private long booksIssuedCount;
    private long totalFinesCount;
    private long pendingFinesCount;
    private long paidFinesCount;
    private double totalFineAmount;
    private double pendingFineAmount;
    private double paidFineAmount;
    private List<FineResponse> recentFines;
}
