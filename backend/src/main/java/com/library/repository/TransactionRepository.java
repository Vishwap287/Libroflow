package com.library.repository;

import com.library.model.Transaction;
import com.library.model.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByStatus(TransactionStatus status);

    List<Transaction> findByMemberId(Long memberId);

    List<Transaction> findByBookId(Long bookId);

    List<Transaction> findByStatusAndDueDateBefore(TransactionStatus status, LocalDate date);

    long countByStatus(TransactionStatus status);
}
