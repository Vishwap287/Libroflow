package com.library.portal.config;

import com.library.portal.model.Fine;
import com.library.portal.model.PaymentStatus;
import com.library.portal.model.PortalUser;
import com.library.portal.repository.FineRepository;
import com.library.portal.repository.PortalUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class PortalDataInitializer implements CommandLineRunner {

    private final PortalUserRepository portalUserRepository;
    private final FineRepository fineRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (portalUserRepository.count() > 0) {
            return;
        }

        PortalUser demoUser = portalUserRepository.save(PortalUser.builder()
                .fullName("Karthik Raja")
                .email("karthik.raja@example.com")
                .phone("9123456780")
                .department("Computer Science")
                .password(passwordEncoder.encode("user123"))
                .status("ACTIVE")
                .build());

        PortalUser demoUser2 = portalUserRepository.save(PortalUser.builder()
                .fullName("Divya Menon")
                .email("divya.menon@example.com")
                .phone("9988776655")
                .department("Mechanical Engineering")
                .password(passwordEncoder.encode("user123"))
                .status("ACTIVE")
                .build());

        // A settled fine (paid, historical)
        fineRepository.save(Fine.builder()
                .userId(demoUser.getUserId())
                .issueDate(LocalDate.now().minusDays(40))
                .dueDate(LocalDate.now().minusDays(26))
                .returnDate(LocalDate.now().minusDays(20))
                .overdueDays(6)
                .fineAmount(30.0)
                .paymentStatus(PaymentStatus.PAID)
                .paymentDate(LocalDate.now().minusDays(19))
                .build());

        // An overdue, unpaid fine still accruing (no return date yet)
        fineRepository.save(Fine.builder()
                .userId(demoUser.getUserId())
                .issueDate(LocalDate.now().minusDays(20))
                .dueDate(LocalDate.now().minusDays(6))
                .returnDate(null)
                .overdueDays(6)
                .fineAmount(30.0)
                .paymentStatus(PaymentStatus.UNPAID)
                .build());

        // A returned-on-time record, no fine
        fineRepository.save(Fine.builder()
                .userId(demoUser2.getUserId())
                .issueDate(LocalDate.now().minusDays(15))
                .dueDate(LocalDate.now().minusDays(1))
                .returnDate(LocalDate.now().minusDays(3))
                .overdueDays(0)
                .fineAmount(0.0)
                .paymentStatus(PaymentStatus.UNPAID)
                .build());

        System.out.println("==============================================");
        System.out.println(" User Portal demo accounts created:");
        System.out.println("   karthik.raja@example.com / user123");
        System.out.println("   divya.menon@example.com   / user123");
        System.out.println("==============================================");
    }
}
