package com.library.portal.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Represents a fine record owned by a portal user. Table: fines.
 * Kept independent of the existing Transaction/Book tables so the new
 * module does not touch any existing admin data.
 */
@Entity
@Table(name = "fines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fine_id")
    private Long fineId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Nullable: only populated when this record originated from a member
    // self-issuing a real catalog book (vs. an admin manually logging a fine).
    @Column(name = "book_id")
    private Long bookId;

    @Column(name = "book_title")
    private String bookTitle;

    @Column(name = "book_author")
    private String bookAuthor;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Builder.Default
    @Column(name = "overdue_days", nullable = false)
    private Integer overdueDays = 0;

    @Builder.Default
    @Column(name = "fine_amount", nullable = false)
    private Double fineAmount = 0.0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(name = "payment_date")
    private LocalDate paymentDate;
}
