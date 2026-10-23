package com.library.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {
    private long totalBooks;
    private long totalCopies;
    private long availableCopies;
    private long totalMembers;
    private long booksIssued;
    private long overdueBooks;
    private double totalFinesCollected;
    private double totalFinesPending;
}
