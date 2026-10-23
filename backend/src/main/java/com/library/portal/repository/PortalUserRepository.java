package com.library.portal.repository;

import com.library.portal.model.PortalUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortalUserRepository extends JpaRepository<PortalUser, Long> {
    Optional<PortalUser> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<PortalUser> findByEmailAndPhone(String email, String phone);
}
