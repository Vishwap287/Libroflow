package com.library.portal.controller;

import com.library.portal.dto.AdminFineResponse;
import com.library.portal.dto.CreateFineRequest;
import com.library.portal.dto.FineResponse;
import com.library.portal.dto.SelfIssueRequest;
import com.library.portal.model.PortalUser;
import com.library.portal.service.FineService;
import com.library.portal.service.PortalUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portal/fines")
@RequiredArgsConstructor
@CrossOrigin
public class FineController {

    private final FineService fineService;
    private final PortalUserService portalUserService;

    /** Admin/librarian only: view fines across all members, with search/filter/pagination. */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<Page<AdminFineResponse>> getAllFines(
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "issueDate"));
        return ResponseEntity.ok(fineService.searchAllForAdmin(query, status, pageable));
    }

    /** Logged-in portal user's own fines, with optional search text, PAID/UNPAID/ALL filter, and pagination. */
    @GetMapping
    public ResponseEntity<Page<FineResponse>> getMyFines(
            Authentication authentication,
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PortalUser user = portalUserService.findByEmailOrThrow(authentication.getName());
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "issueDate"));

        return ResponseEntity.ok(fineService.search(user.getUserId(), query, status, pageable));
    }

    /** Mark one of the logged-in user's own fines as paid. */
    @PostMapping("/{fineId}/pay")
    public ResponseEntity<FineResponse> payFine(Authentication authentication, @PathVariable Long fineId) {
        PortalUser user = portalUserService.findByEmailOrThrow(authentication.getName());
        return ResponseEntity.ok(fineService.payFine(fineId, user.getUserId()));
    }

    /** Member self-service: borrow a book from the catalog (creates a loan/fine record tied to it). */
    @PostMapping("/issue")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<FineResponse> selfIssueBook(Authentication authentication,
                                                       @Valid @RequestBody SelfIssueRequest request) {
        PortalUser user = portalUserService.findByEmailOrThrow(authentication.getName());
        return ResponseEntity.ok(fineService.selfIssueBook(user, request));
    }

    /** Member self-service: return a book they previously self-issued. */
    @PostMapping("/{fineId}/return")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<FineResponse> selfReturnBook(Authentication authentication, @PathVariable Long fineId) {
        PortalUser user = portalUserService.findByEmailOrThrow(authentication.getName());
        return ResponseEntity.ok(fineService.selfReturnBook(fineId, user.getUserId()));
    }

    /**
     * Staff-only: log a new fine/loan record for a portal user.
     * Requires an existing admin/librarian JWT (from the admin module's login) —
     * uses the same ADMIN/LIBRARIAN roles already issued by the existing auth system.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<FineResponse> createFine(@Valid @RequestBody CreateFineRequest request) {
        return ResponseEntity.ok(fineService.createFine(request));
    }
}
