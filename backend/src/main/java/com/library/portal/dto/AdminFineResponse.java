package com.library.portal.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminFineResponse {
    private Long fineId;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private LocalDate returnDate;
    private Integer overdueDays;
    private Double fineAmount;
    private String paymentStatus;
    private LocalDate paymentDate;
}
