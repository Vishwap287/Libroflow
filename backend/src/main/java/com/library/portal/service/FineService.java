package com.library.portal.service;

import com.library.model.Book;
import com.library.portal.dto.*;
import com.library.portal.exception.PortalBadRequestException;
import com.library.portal.exception.PortalNotFoundException;
import com.library.portal.model.Fine;
import com.library.portal.model.PaymentStatus;
import com.library.portal.model.PortalUser;
import com.library.portal.repository.FineRepository;
import com.library.portal.repository.PortalUserRepository;
import com.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FineService {

    private static final double FINE_PER_DAY = 5.0;
    private static final int DEFAULT_LOAN_DAYS = 14;

    private final FineRepository fineRepository;
    private final PortalUserRepository portalUserRepository;
    private final BookRepository bookRepository;

    /** Member self-service: borrow a real catalog book, creating a loan/fine record tied to it. */
    public FineResponse selfIssueBook(PortalUser user, SelfIssueRequest request) {
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new PortalNotFoundException("Book not found"));

        if (book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
            throw new PortalBadRequestException("\"" + book.getTitle() + "\" has no available copies right now");
        }

        int loanDays = request.getLoanDays() != null ? request.getLoanDays() : DEFAULT_LOAN_DAYS;

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        Fine fine = Fine.builder()
                .userId(user.getUserId())
                .bookId(book.getId())
                .bookTitle(book.getTitle())
                .bookAuthor(book.getAuthor())
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(loanDays))
                .paymentStatus(PaymentStatus.UNPAID)
                .build();

        recalculate(fine);
        fineRepository.save(fine);

        return toResponse(fine);
    }

    /** Member self-service: return a book they previously self-issued. Restores catalog stock. */
    public FineResponse selfReturnBook(Long fineId, Long userId) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new PortalNotFoundException("Fine not found"));

        if (!fine.getUserId().equals(userId)) {
            throw new PortalBadRequestException("You are not authorized to return this item");
        }
        if (fine.getReturnDate() != null) {
            throw new PortalBadRequestException("This item has already been marked as returned");
        }

        fine.setReturnDate(LocalDate.now());
        recalculate(fine);
        fineRepository.save(fine);

        if (fine.getBookId() != null) {
            bookRepository.findById(fine.getBookId()).ifPresent(book -> {
                book.setAvailableCopies(book.getAvailableCopies() + 1);
                bookRepository.save(book);
            });
        }

        return toResponse(fine);
    }

    /** Used by admin/librarian staff to log a new loan/fine record for a portal user. */
    public FineResponse createFine(CreateFineRequest request) {
        PortalUser user = portalUserRepository.findById(request.getUserId())
                .orElseThrow(() -> new PortalNotFoundException("User not found with id: " + request.getUserId()));

        if (request.getDueDate().isBefore(request.getIssueDate())) {
            throw new PortalBadRequestException("Due date cannot be before the issue date");
        }
        if (request.getReturnDate() != null && request.getReturnDate().isBefore(request.getIssueDate())) {
            throw new PortalBadRequestException("Return date cannot be before the issue date");
        }

        Fine fine = Fine.builder()
                .userId(user.getUserId())
                .issueDate(request.getIssueDate())
                .dueDate(request.getDueDate())
                .returnDate(request.getReturnDate())
                .paymentStatus(PaymentStatus.UNPAID)
                .build();

        recalculate(fine);
        fineRepository.save(fine);

        return toResponse(fine);
    }

    public DashboardSummaryResponse getSummary(PortalUser user) {
        List<Fine> fines = fineRepository.findByUserId(user.getUserId());
        fines.forEach(this::recalculateAndPersistIfChanged);

        long totalCount = fines.size();
        long pendingCount = fines.stream().filter(f -> f.getPaymentStatus() == PaymentStatus.UNPAID).count();
        long paidCount = totalCount - pendingCount;
        long booksIssuedCount = fines.stream().filter(f -> f.getReturnDate() == null).count();

        double totalAmount = fines.stream().mapToDouble(Fine::getFineAmount).sum();
        double pendingAmount = fines.stream()
                .filter(f -> f.getPaymentStatus() == PaymentStatus.UNPAID)
                .mapToDouble(Fine::getFineAmount).sum();
        double paidAmount = totalAmount - pendingAmount;

        List<FineResponse> recent = fines.stream()
                .sorted((a, b) -> b.getIssueDate().compareTo(a.getIssueDate()))
                .limit(5)
                .map(this::toResponse)
                .toList();

        return DashboardSummaryResponse.builder()
                .fullName(user.getFullName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .booksIssuedCount(booksIssuedCount)
                .totalFinesCount(totalCount)
                .pendingFinesCount(pendingCount)
                .paidFinesCount(paidCount)
                .totalFineAmount(totalAmount)
                .pendingFineAmount(pendingAmount)
                .paidFineAmount(paidAmount)
                .recentFines(recent)
                .build();
    }

    public Page<FineResponse> search(Long userId, String query, String statusFilter, Pageable pageable) {
        // Recalculate any unpaid fines belonging to this user before listing, so figures are current
        fineRepository.findByUserId(userId).forEach(this::recalculateAndPersistIfChanged);

        PaymentStatus status = parseStatus(statusFilter);
        Page<Fine> page = fineRepository.search(userId, status, query, pageable);
        return page.map(this::toResponse);
    }

    /** Admin/librarian use: search fines across all members, with member identity attached. */
    public Page<AdminFineResponse> searchAllForAdmin(String query, String statusFilter, Pageable pageable) {
        fineRepository.findAll().forEach(this::recalculateAndPersistIfChanged);

        PaymentStatus status = parseStatus(statusFilter);
        Page<Fine> page = fineRepository.searchAll(status, query, pageable);

        return page.map(fine -> {
            PortalUser user = portalUserRepository.findById(fine.getUserId()).orElse(null);
            return AdminFineResponse.builder()
                    .fineId(fine.getFineId())
                    .userId(fine.getUserId())
                    .userName(user != null ? user.getFullName() : "Unknown member")
                    .userEmail(user != null ? user.getEmail() : "—")
                    .bookId(fine.getBookId())
                    .bookTitle(fine.getBookTitle())
                    .bookAuthor(fine.getBookAuthor())
                    .issueDate(fine.getIssueDate())
                    .dueDate(fine.getDueDate())
                    .returnDate(fine.getReturnDate())
                    .overdueDays(fine.getOverdueDays())
                    .fineAmount(fine.getFineAmount())
                    .paymentStatus(fine.getPaymentStatus().name())
                    .paymentDate(fine.getPaymentDate())
                    .build();
        });
    }

    private PaymentStatus parseStatus(String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank() || statusFilter.equalsIgnoreCase("ALL")) {
            return null;
        }
        try {
            return PaymentStatus.valueOf(statusFilter.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new PortalBadRequestException("Status filter must be PAID, UNPAID, or ALL");
        }
    }

    public FineResponse payFine(Long fineId, Long userId) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new PortalNotFoundException("Fine not found"));

        if (!fine.getUserId().equals(userId)) {
            throw new PortalBadRequestException("You are not authorized to pay this fine");
        }

        if (fine.getPaymentStatus() == PaymentStatus.PAID) {
            throw new PortalBadRequestException("This fine has already been paid");
        }

        recalculate(fine);
        fine.setPaymentStatus(PaymentStatus.PAID);
        fine.setPaymentDate(LocalDate.now());
        fineRepository.save(fine);

        return toResponse(fine);
    }

    /** Recomputes overdueDays/fineAmount for an UNPAID fine; PAID fines are left as a frozen historical record. */
    private void recalculate(Fine fine) {
        if (fine.getPaymentStatus() == PaymentStatus.PAID) {
            return;
        }
        LocalDate reference = fine.getReturnDate() != null ? fine.getReturnDate() : LocalDate.now();
        long overdueDays = ChronoUnit.DAYS.between(fine.getDueDate(), reference);
        int days = (int) Math.max(0, overdueDays);
        fine.setOverdueDays(days);
        fine.setFineAmount(days * FINE_PER_DAY);
    }

    private void recalculateAndPersistIfChanged(Fine fine) {
        if (fine.getPaymentStatus() == PaymentStatus.PAID) {
            return;
        }
        Integer beforeDays = fine.getOverdueDays();
        Double beforeAmount = fine.getFineAmount();
        recalculate(fine);
        if (!fine.getOverdueDays().equals(beforeDays) || !fine.getFineAmount().equals(beforeAmount)) {
            fineRepository.save(fine);
        }
    }

    private FineResponse toResponse(Fine fine) {
        return FineResponse.builder()
                .fineId(fine.getFineId())
                .bookId(fine.getBookId())
                .bookTitle(fine.getBookTitle())
                .bookAuthor(fine.getBookAuthor())
                .issueDate(fine.getIssueDate())
                .dueDate(fine.getDueDate())
                .returnDate(fine.getReturnDate())
                .overdueDays(fine.getOverdueDays())
                .fineAmount(fine.getFineAmount())
                .paymentStatus(fine.getPaymentStatus().name())
                .paymentDate(fine.getPaymentDate())
                .build();
    }
}
