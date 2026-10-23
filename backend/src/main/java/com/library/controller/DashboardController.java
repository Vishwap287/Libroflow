package com.library.controller;

import com.library.dto.DashboardStats;
import com.library.model.Book;
import com.library.model.Transaction;
import com.library.model.TransactionStatus;
import com.library.portal.model.Fine;
import com.library.portal.model.PaymentStatus;
import com.library.portal.repository.FineRepository;
import com.library.repository.BookRepository;
import com.library.repository.MemberRepository;
import com.library.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin
public class DashboardController {

    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final TransactionRepository transactionRepository;
    private final FineRepository fineRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        long totalBooks = bookRepository.count();
        long totalCopies = bookRepository.findAll().stream().mapToLong(Book::getTotalCopies).sum();
        long availableCopies = bookRepository.findAll().stream().mapToLong(Book::getAvailableCopies).sum();
        long totalMembers = memberRepository.count();

        // --- Admin Issue/Return module (Transaction table) ---
        long transactionsIssued = transactionRepository.countByStatus(TransactionStatus.ISSUED)
                + transactionRepository.countByStatus(TransactionStatus.OVERDUE);
        long transactionsOverdue = transactionRepository.countByStatus(TransactionStatus.OVERDUE);

        double transactionFinesCollected = transactionRepository.findByStatus(TransactionStatus.RETURNED)
                .stream().mapToDouble(Transaction::getFine).sum();
        double transactionFinesPending = transactionRepository.findByStatus(TransactionStatus.OVERDUE)
                .stream().mapToDouble(Transaction::getFine).sum();

        // --- Member portal self-issue module (Fine table) ---
        LocalDate today = LocalDate.now();
        long fineLoansIssued = fineRepository.findAll().stream()
                .filter(f -> f.getReturnDate() == null)
                .count();
        long fineLoansOverdue = fineRepository.findAll().stream()
                .filter(f -> f.getReturnDate() == null && f.getDueDate().isBefore(today))
                .count();

        double fineAmountCollected = fineRepository.findByPaymentStatus(PaymentStatus.PAID)
                .stream().mapToDouble(Fine::getFineAmount).sum();
        double fineAmountPending = fineRepository.findByPaymentStatus(PaymentStatus.UNPAID)
                .stream().mapToDouble(Fine::getFineAmount).sum();

        // --- Combined totals across both modules ---
        DashboardStats stats = DashboardStats.builder()
                .totalBooks(totalBooks)
                .totalCopies(totalCopies)
                .availableCopies(availableCopies)
                .totalMembers(totalMembers)
                .booksIssued(transactionsIssued + fineLoansIssued)
                .overdueBooks(transactionsOverdue + fineLoansOverdue)
                .totalFinesCollected(transactionFinesCollected + fineAmountCollected)
                .totalFinesPending(transactionFinesPending + fineAmountPending)
                .build();

        return ResponseEntity.ok(stats);
    }
}
