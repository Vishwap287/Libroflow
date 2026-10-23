package com.library.controller;

import com.library.dto.IssueBookRequest;
import com.library.model.Transaction;
import com.library.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<Transaction>> getOverdueTransactions() {
        return ResponseEntity.ok(transactionService.getOverdueTransactions());
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<Transaction>> getMemberHistory(@PathVariable Long memberId) {
        return ResponseEntity.ok(transactionService.getMemberHistory(memberId));
    }

    @PostMapping("/issue")
    public ResponseEntity<Transaction> issueBook(@Valid @RequestBody IssueBookRequest request) {
        return ResponseEntity.ok(transactionService.issueBook(request));
    }

    @PostMapping("/return/{transactionId}")
    public ResponseEntity<Transaction> returnBook(@PathVariable Long transactionId) {
        return ResponseEntity.ok(transactionService.returnBook(transactionId));
    }
}
