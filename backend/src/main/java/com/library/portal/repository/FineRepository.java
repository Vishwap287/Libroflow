package com.library.portal.repository;

import com.library.portal.model.Fine;
import com.library.portal.model.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FineRepository extends JpaRepository<Fine, Long> {

    List<Fine> findByUserId(Long userId);

    List<Fine> findByPaymentStatus(PaymentStatus paymentStatus);

    /**
     * Search a user's fines by matching against dates (as text) and paginate.
     * Filtering by payment status is optional (pass null to include all).
     */
    @Query("SELECT f FROM Fine f WHERE f.userId = :userId " +
           "AND (:status IS NULL OR f.paymentStatus = :status) " +
           "AND (:query IS NULL OR :query = '' OR " +
           "     CAST(f.issueDate AS string) LIKE CONCAT('%', :query, '%') OR " +
           "     CAST(f.dueDate AS string) LIKE CONCAT('%', :query, '%') OR " +
           "     CAST(f.returnDate AS string) LIKE CONCAT('%', :query, '%') OR " +
           "     CAST(f.fineAmount AS string) LIKE CONCAT('%', :query, '%'))")
    Page<Fine> search(@Param("userId") Long userId,
                       @Param("status") PaymentStatus status,
                       @Param("query") String query,
                       Pageable pageable);

    /** Admin-wide search across all users' fines (no userId restriction). */
    @Query("SELECT f FROM Fine f WHERE " +
           "(:status IS NULL OR f.paymentStatus = :status) " +
           "AND (:query IS NULL OR :query = '' OR " +
           "     CAST(f.issueDate AS string) LIKE CONCAT('%', :query, '%') OR " +
           "     CAST(f.dueDate AS string) LIKE CONCAT('%', :query, '%') OR " +
           "     CAST(f.returnDate AS string) LIKE CONCAT('%', :query, '%') OR " +
           "     CAST(f.fineAmount AS string) LIKE CONCAT('%', :query, '%'))")
    Page<Fine> searchAll(@Param("status") PaymentStatus status,
                          @Param("query") String query,
                          Pageable pageable);
}
