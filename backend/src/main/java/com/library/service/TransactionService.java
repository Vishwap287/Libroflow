package com.library.service;

import com.library.dto.IssueBookRequest;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.model.*;
import com.library.repository.BookRepository;
import com.library.repository.MemberRepository;
import com.library.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private static final int DEFAULT_LOAN_DAYS = 14;
    private static final double FINE_PER_DAY = 5.0; // currency units per day overdue

    private final TransactionRepository transactionRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;

    public List<Transaction> getAllTransactions() {
        refreshOverdueStatuses();
        return transactionRepository.findAll();
    }

    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
    }

    public List<Transaction> getOverdueTransactions() {
        refreshOverdueStatuses();
        return transactionRepository.findByStatusAndDueDateBefore(TransactionStatus.OVERDUE, LocalDate.now().plusDays(1));
    }

    public List<Transaction> getMemberHistory(Long memberId) {
        return transactionRepository.findByMemberId(memberId);
    }

    public Transaction issueBook(IssueBookRequest request) {
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + request.getBookId()));
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + request.getMemberId()));

        if (book.getAvailableCopies() <= 0) {
            throw new BadRequestException("No available copies of \"" + book.getTitle() + "\" to issue");
        }

        int loanDays = request.getLoanDays() != null ? request.getLoanDays() : DEFAULT_LOAN_DAYS;

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        Transaction transaction = Transaction.builder()
                .book(book)
                .member(member)
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(loanDays))
                .status(TransactionStatus.ISSUED)
                .fine(0.0)
                .build();

        return transactionRepository.save(transaction);
    }

    public Transaction returnBook(Long transactionId) {
        Transaction transaction = getTransactionById(transactionId);

        if (transaction.getStatus() == TransactionStatus.RETURNED) {
            throw new BadRequestException("This book has already been returned");
        }

        LocalDate today = LocalDate.now();
        transaction.setReturnDate(today);

        long overdueDays = ChronoUnit.DAYS.between(transaction.getDueDate(), today);
        double fine = overdueDays > 0 ? overdueDays * FINE_PER_DAY : 0.0;
        transaction.setFine(fine);
        transaction.setStatus(TransactionStatus.RETURNED);

        Book book = transaction.getBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        return transactionRepository.save(transaction);
    }

    /** Marks any ISSUED transaction past its due date as OVERDUE and recalculates running fine. */
    private void refreshOverdueStatuses() {
        LocalDate today = LocalDate.now();
        List<Transaction> issued = transactionRepository.findByStatus(TransactionStatus.ISSUED);
        for (Transaction t : issued) {
            if (t.getDueDate().isBefore(today)) {
                t.setStatus(TransactionStatus.OVERDUE);
                long overdueDays = ChronoUnit.DAYS.between(t.getDueDate(), today);
                t.setFine(overdueDays * FINE_PER_DAY);
                transactionRepository.save(t);
            }
        }
    }
}
